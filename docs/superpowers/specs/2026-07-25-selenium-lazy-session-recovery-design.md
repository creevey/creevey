# Design: Selenium Lazy Session Recovery (Remove Keep-Alive)

**Date:** 2026-07-25  
**Status:** Approved  
**Goal:** Stop spending on Selenium Grid as a Service during idle UI-mode sessions by removing the periodic keep-alive, and transparently recreate sessions that the grid reaps after inactivity.

## Problem

Creevey holds a Selenium session open for the entire lifetime of each worker process. In UI mode workers stay alive indefinitely while waiting for the user to trigger runs, so the session — and the billable grid time — accrues continuously, even during long idle periods.

The mechanism that forces this is the keep-alive in `src/server/selenium/internal.ts`:

- `InternalBrowser.keepAlive()` (`internal.ts:855-871`) issues `this.#browser.getCurrentUrl()` every 10 seconds purely to generate traffic so the grid does not reap the idle session.
- It is started unconditionally as the last step of `init()` (`internal.ts:500-514`), so it runs in both UI and CI mode. It only matters in UI mode, where workers idle between user-triggered runs.
- The Playwright backend has no keep-alive; this is Selenium-only.

On grids billed by running time (Selenium Grid as a Service, BrowserStack, Sauce Labs, LambdaTest, etc.) this idle traffic is pure waste.

## Selected Approach

Remove the keep-alive entirely (both UI and CI modes) and rely on the grid's own idle session timeout to reap idle sessions. When the user eventually triggers a run, Creevey lazily detects the dead session via a cheap pre-test liveness probe and transparently recreates it in-process, escalating to the existing master kill+refork path only if in-process recovery fails.

Recovery is transparent and server-side only: no UI changes, no WebSocket protocol changes, no new config options.

## Decisions

| Decision            | Choice                                   | Rationale                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| Scope of removal    | Remove everywhere (UI and CI)            | One code path; CI is unaffected in practice (tests are continuous)             |
| Idle timeout source | Rely on grid default                     | Stay grid-agnostic; users tune their own grid via `seleniumCapabilities`       |
| Detection placement | Dedicated pre-test liveness probe        | Clean separation of probing from test execution; predictable detection surface |
| Recovery mechanism  | In-process recreate, escalate on failure | Fast common case; proven kill+refork as fallback                               |
| UI feedback         | Transparent + logs only                  | Minimal scope; no protocol/UI changes                                          |

## Architecture

### Before

```text
worker init
  -> openBrowser(true)
       -> buildWebdriver()
       -> init()
            -> ... storybook setup ...
            -> keepAlive()   // 10s getCurrentUrl() ping, forever
  -> ready

(test run)
  -> switchStory(...)
  -> test.fn(...)
```

Session stays alive indefinitely via the keep-alive ping. Grid bills for the whole lifetime.

### After

```text
worker init
  -> openBrowser(true)
       -> buildWebdriver()
       -> init()
            -> ... storybook setup ...   // no keepAlive
       -> #lastActivityAt = now          // tracked on SeleniumWebdriver
  -> ready

(test run)
  -> webdriver.ensureBrowser()           // SeleniumWebdriver; liveness probe, activity-gated
       -> if recent activity: return     // free during continuous runs
       -> this.#browser.browser.getTitle()
            -> resolves: return
            -> session-dead error: this.openBrowser(true) recreates in-process
            -> other error: rethrow as normal test error
  -> switchStory(...)
  -> test.fn(...)
```

Session is reaped by the grid after its idle timeout. On the next test, Creevey recreates it lazily. Grid bills only for active work plus the short idle timeout window.

## Code Changes

### 1. Remove the keep-alive

In `src/server/selenium/internal.ts`:

- Delete the `keepAlive()` method (`internal.ts:855-871`).
- Delete the `#keepAliveInterval` field declaration (`internal.ts:218`).
- Remove the `() => { this.keepAlive(); }` entry from the `init()` run-sequence (`internal.ts:500-514`).
- Remove the `if (this.#keepAliveInterval !== null) clearInterval(this.#keepAliveInterval);` line in `closeBrowser()` (`internal.ts:237`).

### 2. Add activity tracking

In `src/server/selenium/webdriver.ts`:

- Add a private `#lastActivityAt: number` field on `SeleniumWebdriver`, initialized to `Date.now()` when the browser is first opened.
- Update `#lastActivityAt = Date.now()` after each successful probe and after a successful in-process recovery, so the gate reflects the most recent real activity. Tracking it on `SeleniumWebdriver` (rather than `InternalBrowser`) ensures the timestamp survives the InternalBrowser replacement that recovery performs.

### 3. Add `ensureBrowser()` to the webdriver interface

In `src/server/webdriver.ts` (`CreeveyWebdriverBase`):

- Add a default method `async ensureBrowser(): Promise<boolean> { return false; }`. The boolean signals whether the session was recreated, so callers can refresh any cached session id only when needed.

In `src/server/selenium/webdriver.ts` (`SeleniumWebdriver`):

- Override `ensureBrowser()` to implement the probe + gate + recovery directly. It lives here (not on `InternalBrowser`) because `SeleniumWebdriver` owns the `#browser: InternalBrowser | null` lifecycle and is the only object that can replace it via `openBrowser(true)`.

### 4. Implement the liveness probe + gate + recovery

In `src/server/selenium/webdriver.ts`, on `SeleniumWebdriver`:

```ts
async ensureBrowser(): Promise<boolean> {
  if (!this.#browser) return false; // nothing to probe; creation is handled by openBrowser
  // Gate: skip the probe if the session was used moments ago.
  if (Date.now() - this.#lastActivityAt < IDLE_PROBE_THRESHOLD) return false;

  this.#lastActivityAt = Date.now();

  try {
    // Cheap read-only command that round-trips to the grid; reveals a reaped session.
    await this.#browser.browser.getTitle();
    return false; // session is alive
  } catch (error) {
    if (!isSessionDeadError(error)) throw error;
    logger().info('Session appears dead; recreating...');
    // Reuses the existing close+rebuild+re-init path (webdriver.ts:46-75).
    // openBrowser(true) discards the dead InternalBrowser and builds a fresh one.
    if ((await this.openBrowser(true)) == null) {
      // Grid refused a new session; let this propagate as subtype:'unknown' -> kill+refork.
      throw new Error('Failed to recreate session after it was reaped by the grid');
    }
    this.#lastActivityAt = Date.now();
    return true; // session was recreated; caller should refresh any cached session id
  }
}
```

- `this.#browser.browser` is the raw `WebDriver` exposed by the `InternalBrowser.browser` getter (`internal.ts:228-230`).
- `this.openBrowser(true)` (`webdriver.ts:46-75`) already does close → `buildWebdriver` → `init`; it replaces `this.#browser` with a fresh `InternalBrowser`. The dead instance is discarded, so no separate `#recreateSession` method or cross-reference between `InternalBrowser` and `SeleniumWebdriver` is needed.
- `IDLE_PROBE_THRESHOLD` is a named constant value `30_000`, with a comment that it must stay comfortably below typical grid idle timeouts (Selenoid ~60s, Selenium Grid 4 ~300s). It is not configurable (per the decision to rely on grid defaults).
- `isSessionDeadError` is the classifier described in the Error Classification section below.

No recursion guard is required: `ensureBrowser()` is called exactly once per test by the worker, and `openBrowser(true)` does not call back into `ensureBrowser()`. A failed `openBrowser(true)` throws once and escalates.

### 5. Call `ensureBrowser()` from the worker test handler

In `src/server/worker/start.ts`, inside the `subscribeOn('test', ...)` handler, call the probe at the top of the async IIFE, before `webdriver.switchStory(...)`:

```ts
(async () => {
  // ...
  try {
    try {
      if (await webdriver.ensureBrowser()) {
        // lazy recovery if session was reaped
        sessionId = await webdriver.getSessionId();
      }
    } catch (recoveryError) {
      // ensureBrowser threw (recovery failed, or a non-session-dead probe error
      // escaped). The worker is now unreliable/browserless, so escalate directly
      // to a fatal worker error — do NOT route through runHandler, whose
      // hasTimeout/hasDisconnected heuristic would misclassify it.
      emitWorkerMessage({
        type: 'error',
        payload: { subtype: 'unknown', error: serializeError(recoveryError) },
      });
      return;
    }
    await Promise.race([
      // existing timeout race
      (async () => {
        const context = await webdriver.switchStory(test.story, baseContext);
        await test.fn(context);
      })(),
    ]);
  } catch (testError) {
    error = testError;
  }
  // ...
})();
```

The worker wraps the `ensureBrowser()` call in a dedicated try/catch (separate from the test's try/catch). If `ensureBrowser()` throws (only possible when in-process recovery itself fails, or a non-session-dead probe error escapes), the worker emits `subtype:'unknown'` directly and returns from the test handler — it does NOT route through `runHandler`, whose message heuristic (`hasTimeout`/`hasDisconnected`) would misclassify the recovery error as a normal test failure. The master kill+refork path engages, and `afterTest` is not run on a browserless worker.

### 6. Make the captured session id reassignable

In `src/server/worker/start.ts`:

- Change `const [sessionId, webdriver] = ...` (`worker/start.ts:124-127`) to use a `let sessionId` so it can be reassigned.
- The result payload reuses `sessionId` (`worker/start.ts:217`); because the refresh happens inside `ensureBrowser()`'s success branch (section 5), every result after a recovery carries the correct new session id.

`webdriver.getSessionId()` resolves the cached `Session` object locally (no server round-trip), so the refresh is free.

## Error Classification

Recovery hinges on reliably distinguishing a reaped session from ordinary test failures. Add a helper in `src/server/selenium/internal.ts` (it depends on `NoSuchSessionError` from `selenium-webdriver`, which this module already imports):

```ts
export function isSessionDeadError(error: unknown): boolean { ... }
```

It is exported so `SeleniumWebdriver.ensureBrowser()` can lazy-import it from `./internal.js` inside its catch block, preserving the existing invariant that `selenium-webdriver` is not loaded until a worker actually opens a browser.

Signals, checked in order:

1. **Error class:** `error instanceof NoSuchSessionError` (the primary, strong signal).
2. **Error name:** `error.name === 'NoSuchSessionError'` (vendored/wrapped errors that lose the class).
3. **Message substring fallback:** case-insensitive match on stable W3C WebDriver / common-vendor phrasings: `'no such session'`, `'session not found'`, `'session does not exist'`, `'session timed out or not found'`, `'invalid session id'`.

Negative guard: the substring path explicitly excludes messages containing `'timeout'` or `'disconnected'`, which already have dedicated handling (`worker/start.ts:64-68` → `subtype:'unknown'`) and must not be conflated with session death. A genuine `NoSuchSessionError` instance wins regardless of its message.

Failure modes are safe by design:

- **Missed classification** degrades to the existing behavior (test fails, possibly escalates as `unknown`).
- **False positive** needlessly recreates a live session — wasteful but harmless.

So the classifier errs toward precision: require either a strong signal (class/name) or an exact W3C-phrase substring match.

## Files Changed

| File                               | Action | Reason                                                                                                                                                                                                             |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/server/selenium/internal.ts`  | Update | Delete keep-alive; add `isSessionDeadError` classifier and `IDLE_PROBE_THRESHOLD` constant (depend on `selenium-webdriver`, which this module already imports)                                                     |
| `src/server/webdriver.ts`          | Update | Add default no-op `ensureBrowser()` to `CreeveyWebdriverBase`                                                                                                                                                      |
| `src/server/selenium/webdriver.ts` | Update | Override `ensureBrowser()` with probe+gate+recovery; add `#lastActivityAt`; lazy-import `isSessionDeadError` from `./internal.js` inside the catch to preserve the existing selenium-webdriver lazy-load invariant |
| `src/server/worker/start.ts`       | Update | Call `ensureBrowser()` before each test; make `sessionId` reassignable and refresh it after recovery                                                                                                               |
| `docs/grid.md`                     | Update | Document idle-session behavior and grid timeout recommendation                                                                                                                                                     |
| `memories/architecture.md`         | Update | Note `ensureBrowser()` and lazy-recovery model                                                                                                                                                                     |
| `memories/troubleshooting.md`      | Update | Document recovery diagnostics                                                                                                                                                                                      |
| `memories/memory.md`               | Update | High-level narrative mention                                                                                                                                                                                       |

## Behavior Changes

### UI Mode

- Workers no longer hold sessions open during idle. Grid billing accrues only for active test runs plus the grid's idle timeout window after the last activity.
- When the user triggers a run after long idle, the first affected test triggers a transparent session recreate (a few seconds of additional `running` time), then proceeds normally. Subsequent tests in the same batch skip the probe (activity gate).

### CI Mode

- No behavioral change in practice. Tests run continuously, the activity gate keeps the probe suppressed, and the process exits after the run. Recovery logic is available if a session ever dies mid-suite.

### Escalation

- If in-process recovery fails (e.g. grid refuses a new session), the worker catches the `ensureBrowser()` throw in a dedicated handler and emits `subtype:'unknown'` directly; the master kills and reforks the worker (`pool.ts:122-136`), and the test is re-queued. This reuses the existing kill+refork behavior for unrecoverable situations.

## Retry-Budget Interaction

- **In-process recovery success:** consumes zero pool retry credits. The test runs normally against the fresh session; the result is not marked as a retry.
- **Escalation to kill+refork:** existing `subtype:'unknown'` semantics apply (`pool.ts:168-172`); the test is re-queued and consumes one of the pool's `maxRetries`. Unchanged behavior.

## Error Handling

- Probe throws a non-session-dead error: rethrown by `ensureBrowser()`; caught by the worker's dedicated `ensureBrowser()` catch and escalated to `subtype:'unknown'` (master kill+refork). This is safe — the test is retried on a fresh worker, bounded by `maxRetries`/`FORK_RETRIES`. (Non-session-dead probe failures are rare: `getTitle()` almost always fails with session-death, so over-escalation is negligible.)
- In-process recreate throws or `openBrowser(true)` returns null: rethrown from `ensureBrowser()` as `'Failed to recreate session after it was reaped by the grid'`; the worker catches it in the same dedicated try/catch around `ensureBrowser()` and emits `subtype:'unknown'` directly (bypassing `runHandler`'s message heuristic); master kill+refork engages and the test is re-queued.
- No recursion guard is needed: `ensureBrowser()` is invoked exactly once per test, and `openBrowser(true)` does not call back into it. A failed recreate throws once and escalates.

## Scope Boundaries (Out of Scope)

- Master process, `CreeveyApi`, HTTP routes, WebSocket protocol, and the React UI: zero changes.
- Playwright backend: inherits the no-op `ensureBrowser()` default; no edits.
- `report` command: never opens sessions; unaffected.
- Grid startup (Selenoid) and capabilities: no injected `sessionTimeout`; users keep tuning their own grid.
- Pool retry semantics and worker fork/queue logic: unchanged; escalation reuses them as-is.

## Testing

Vitest unit tests with stubs (no real grid required):

1. **`isSessionDeadError` unit tests** — cover: real `NoSuchSessionError` instance; `error.name` match; each W3C phrase substring; negative cases (`Error('timeout')`, `Error('disconnected')`, `Error('element not found')`, unrelated stack). Highest-value test; classification correctness is the linchpin.
2. **Activity gate unit test** — `SeleniumWebdriver.ensureBrowser()` skips the probe when `#lastActivityAt` is recent; invokes `getTitle()` when stale. Fake timer / injected clock.
3. **Recovery flow test** — stub the `InternalBrowser` so its raw WebDriver's `getTitle()` rejects once with `NoSuchSessionError`, then resolves; stub `openBrowser(true)` to rebuild; assert `ensureBrowser()` returns `true`, `openBrowser(true)` is called once, a subsequent `getSessionId()` reflects the new session, and no `subtype:'unknown'` is emitted by the worker.
4. **Escalation test** — stub `openBrowser(true)` to return null (grid refused a new session); assert `ensureBrowser()` throws, and the worker surfaces `subtype:'unknown'` so master kill+refork engages.

No recursion-guard test is needed because the design has no recursion path.

## Trade-offs

### Benefits

- Eliminates idle grid spend in UI mode — the primary cost-saving goal.
- Single, simple code path (no mode-specific keep-alive gating).
- Reuses both existing recovery mechanisms (`openBrowser(true)` and kill+refork).
- No protocol, UI, or config surface added.
- CI behavior unchanged in practice.

### Costs

- First test after idle pays a one-time recreate cost (a few seconds). Acceptable and expected.
- One cheap probe command per test when the activity gate fires (i.e. only after a ~30s gap), negligible versus test cost.
- `isSessionDeadError` needs maintenance if vendors introduce new phrasings; mitigated by the class/name strong signals and the safe failure-mode (misses degrade gracefully).

## Alternatives Considered

### Boundary recovery (try-then-recover inside test execution)

Rejected. Recovery logic would wrap test execution, mixing concerns; the detection surface would be whatever arbitrary command a test issues first (less predictable than a dedicated probe). The user explicitly preferred the dedicated pre-test probe (Approach C).

### Command-layer guard (intercept every WebDriver command)

Rejected. Intercepts every command, risks leaving partial test state on mid-test recovery, and is over-engineered for the realistic threat (session reaped after idle, detected at the start of the next test).

### Master kill+refork only

Rejected as the primary mechanism. Proven but heavy: full process restart plus storybook re-init on every dead session. Kept as the escalation fallback.

### Force a short `sessionTimeout` capability

Rejected. Imposes grid behavior; some vendors ignore or reject unknown caps. Users can already tune this via `seleniumCapabilities`.

### Make keep-alive configurable

Rejected. The default behavior still needs recovery logic, and the option adds API surface for no real benefit.

## Rollback Plan

1. Restore `keepAlive()`, the `#keepAliveInterval` field, the `init()` sequence entry, and the `closeBrowser()` clear line.
2. Remove `ensureBrowser()` from the interface, the Selenium override, and the worker call site (revert the `if (await webdriver.ensureBrowser())` block).
3. Revert `sessionId` back to `const`.
4. Remove `isSessionDeadError`, `#lastActivityAt`, and `IDLE_PROBE_THRESHOLD`.

## Success Criteria

- No WebDriver traffic is generated while a UI-mode worker is idle between user-triggered runs.
- After a grid reaps an idle session, the next test run transparently recreates the session and passes, with a visible `Session appears dead; recreating...` log line and no user-visible error.
- Continuous CI runs and rapid UI batches incur no per-test probe (activity gate suppresses it).
- Persistent recovery failures escalate to worker kill+refork with `subtype:'unknown'`, matching existing behavior.
- The Playwright backend, master API, WebSocket protocol, and React UI are untouched.
