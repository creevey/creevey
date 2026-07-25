# Selenium Lazy Session Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Selenium keep-alive that wastes billable grid time during idle UI-mode sessions, and lazily recreate sessions that the grid reaps, so clicking "run" after long idle just works.

**Architecture:** A `ensureBrowser(): Promise<boolean>` method is added to the webdriver interface (no-op default). The Selenium implementation runs an activity-gated liveness probe (`getTitle()`) before each test; on a session-dead error it reuses the existing `openBrowser(true)` path to rebuild the session in-process, escalating to the existing master kill+refork path only if rebuild fails. Detection is isolated in a pure `isSessionDeadError` classifier.

**Tech Stack:** TypeScript (strict), Vitest, `selenium-webdriver` (optional peer dep), Node.js cluster IPC.

## Global Constraints

- TypeScript strict mode; no `any` types, no unused vars/params.
- Prettier: single quotes, 120 width, trailing commas — enforced by `yarn fix` and pre-commit hooks.
- `selenium-webdriver` is an **optional** peer dependency: code in `src/server/selenium/webdriver.ts` must NOT statically import `./internal.js` (which imports `selenium-webdriver`) — it must dynamic-import it, so module load never crashes when selenium-webdriver is absent. This invariant already exists in `openBrowser` and must be preserved.
- Tests live in `tests/` with `.test.ts` extension; run with `yarn test` (=`vitest run`); single file: `yarn test tests/<file>.test.ts`.
- Lint before commit: `yarn lint` (tsc + eslint + prettier). Auto-fix: `yarn fix`.
- Frequent commits, one logical change per commit, conventional-commit messages (`feat:`, `refactor:`, `test:`, `docs:`).
- Reference design spec: `docs/superpowers/specs/2026-07-25-selenium-lazy-session-recovery-design.md`.

## Spec Refinements (plan-level decisions)

These refinements uphold correctness or documented invariants; the spec is the design source of truth, but where the plan differs it is noted here.

1. **`IDLE_PROBE_THRESHOLD` placement.** The spec's Files Changed table lists it under `internal.ts`. This plan places it in `src/server/selenium/webdriver.ts` (the only file that uses it), so `webdriver.ts` does not statically import `./internal.js`. This preserves the optional-dependency lazy-load invariant (selenium-webdriver may be absent for Playwright-only users). `isSessionDeadError` remains in `internal.ts` (it needs `selenium-webdriver`'s `error.NoSuchSessionError`) and is dynamic-imported by `webdriver.ts` inside the catch block.

2. **`isSessionDeadError` timeout/disconnected guard removed.** The spec specified a substring guard excluding messages containing `'timeout'`/`'disconnected'`, AND listed `'session timed out or not found'` as a recognized W3C phrase. These contradict: that phrase contains `'timeout'`, so the guard would always reject it (the phrase would be dead). The plan removes the blanket guard because the phrase list is specific enough that generic timeout/disconnect messages (e.g. `'Request timed out'`, `'socket disconnected'`) match none of the phrases and correctly return `false`. The dedicated `subtype:'unknown'` handling for timeouts/disconnects lives at the worker layer (`worker/start.ts`), unaffected.

---

## Task 1: Add `isSessionDeadError` classifier

Classify whether a thrown error means the Selenium session was reaped by the grid. Pure function, fully unit-testable. This is the linchpin of recovery correctness.

**Files:**

- Modify: `src/server/selenium/internal.ts` (add `error` to the `selenium-webdriver` import on line 8; add exported `isSessionDeadError` function and `IDLE_PROBE_THRESHOLD` is NOT here — see refinement).
- Test: `tests/seleniumSessionRecovery.test.ts` (create).

**Interfaces:**

- Consumes: `error.NoSuchSessionError` from `selenium-webdriver`.
- Produces: `export function isSessionDeadError(error: unknown): boolean` — used by Task 4's `ensureBrowser()` via dynamic import.

- [ ] **Step 1: Write the failing tests**

Create `tests/seleniumSessionRecovery.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { error } from 'selenium-webdriver';

import { isSessionDeadError } from '../src/server/selenium/internal.js';

const { NoSuchSessionError } = error;

describe('isSessionDeadError', () => {
  test('matches a real NoSuchSessionError instance', () => {
    expect(isSessionDeadError(new NoSuchSessionError('session not found'))).toBe(true);
  });

  test('matches by error.name when the class is lost (vendored/wrapped)', () => {
    const e = new Error('session does not exist');
    e.name = 'NoSuchSessionError';
    expect(isSessionDeadError(e)).toBe(true);
  });

  test.each([
    'no such session',
    'session not found',
    'Session does not exist',
    'Session timed out or not found',
    'invalid session id',
  ])('matches by W3C substring: %s', (message) => {
    expect(isSessionDeadError(new Error(message))).toBe(true);
  });

  test.each([
    'timeout of 60000ms exceeded',
    'ECONNRESET socket disconnected',
    'no such element',
    'element click intercepted',
    'unexpected token < in JSON',
  ])('does NOT match unrelated errors: %s', (message) => {
    expect(isSessionDeadError(new Error(message))).toBe(false);
  });

  test('does not treat a generic timeout as session death via substring', () => {
    // A bare 'timeout' must NOT be classified as session-dead by the substring path:
    // timeouts already have dedicated handling (worker -> subtype:'unknown').
    expect(isSessionDeadError(new Error('Request timed out'))).toBe(false);
  });

  test('a genuine NoSuchSessionError wins even if its message contains timeout', () => {
    expect(isSessionDeadError(new NoSuchSessionError('session timed out or not found'))).toBe(true);
  });

  test('handles non-Error inputs', () => {
    expect(isSessionDeadError(undefined)).toBe(false);
    expect(isSessionDeadError(null)).toBe(false);
    expect(isSessionDeadError('session not found')).toBe(false);
    expect(isSessionDeadError({ name: 'NoSuchSessionError' })).toBe(true);
    expect(isSessionDeadError({ message: 'no such session' })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test tests/seleniumSessionRecovery.test.ts`
Expected: FAIL — `isSessionDeadError is not exported from ../src/server/selenium/internal.js`.

- [ ] **Step 3: Implement the classifier**

In `src/server/selenium/internal.ts`, update the `selenium-webdriver` import (line 8) to also import the `error` namespace:

```ts
import { Builder, By, Capabilities, Origin, WebDriver, WebElement, error, logging } from 'selenium-webdriver';
```

Then add the exported classifier function near the other module-level helpers (e.g. just above `export class InternalBrowser` around line 213):

```ts
const SESSION_DEAD_PHRASES = [
  'no such session',
  'session not found',
  'session does not exist',
  'session timed out or not found',
  'invalid session id',
];

/**
 * Returns true when an error indicates the WebDriver session no longer exists on
 * the grid (reaped after idle timeout, restarted, etc.). Errs toward precision:
 * a strong signal (the NoSuchSessionError class/name) always wins; otherwise an
 * exact W3C-phrase substring match is required.
 *
 * Note: generic timeouts/disconnects are NOT separately excluded — the phrase
 * list is specific enough that messages like "Request timed out" or "socket
 * disconnected" match none of the phrases, so they correctly return false and
 * keep their existing `subtype:'unknown'` handling at the worker layer.
 */
export function isSessionDeadError(error: unknown): boolean {
  if (!error) return false;

  const name = (error as { name?: unknown }).name;
  const message = (error as { message?: unknown }).message;

  // Strong signal: the real class, or an object whose name matches.
  if (typeof error === 'object' && error instanceof NoSuchSessionErrorClass) return true;
  if (name === 'NoSuchSessionError') return true;

  const messageStr = typeof message === 'string' ? message.toLowerCase() : '';
  if (!messageStr) return false;

  // Substring fallback: an exact W3C-phrase match. Phrase specificity is the
  // guard against false positives (no generic timeout/disconnect string matches).
  return SESSION_DEAD_PHRASES.some((phrase) => messageStr.includes(phrase));
}
```

Note: `NoSuchSessionError` is accessed as `error.NoSuchSessionError` (the `error` namespace imported above). Because the local parameter is also named `error`, reference the class via a small alias at module scope, added right after the import:

```ts
const NoSuchSessionErrorClass = error.NoSuchSessionError;
```

(Using the alias `NoSuchSessionErrorClass` avoids shadowing confusion with the function parameter `error`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test tests/seleniumSessionRecovery.test.ts`
Expected: PASS — all `isSessionDeadError` cases green.

- [ ] **Step 5: Lint and typecheck**

Run: `yarn lint`
Expected: PASS (no tsc/eslint/prettier errors). If prettier reports formatting, run `yarn fix`.

- [ ] **Step 6: Commit**

```bash
git add src/server/selenium/internal.ts tests/seleniumSessionRecovery.test.ts
git commit -m "feat(selenium): add isSessionDeadError session-death classifier"
```

---

## Task 2: Remove the keep-alive

Delete the keep-alive mechanism so idle sessions are no longer artificially held open. This is the "stop spending" half. Pure deletion; correctness is verified by typecheck/lint (no dangling references) and by the recovery tests added in Task 4 exercising the no-keep-alive path.

**Files:**

- Modify: `src/server/selenium/internal.ts`.

**Interfaces:**

- Consumes: nothing new.
- Produces: removal of `keepAlive()`, `#keepAliveInterval`, the init-sequence step, and the `closeBrowser()` clear. No other file references these (grep-confirmed in the design spec).

- [ ] **Step 1: Delete the `keepAlive()` method**

In `src/server/selenium/internal.ts`, delete the entire `private keepAlive(): void { ... }` method (currently at lines 855-871, ending the class body).

- [ ] **Step 2: Delete the `#keepAliveInterval` field**

Delete the field declaration (currently line 218):

```ts
  #keepAliveInterval: NodeJS.Timeout | null = null;
```

- [ ] **Step 3: Remove the init-sequence step that starts keep-alive**

In the `init()` method's `runSequence([...])` call (currently lines 500-514), remove this entry from the array (currently lines 509-511):

```ts
        () => {
          this.keepAlive();
        },
```

The sequence should now end after `() => this.resizeViewport(viewport),`.

- [ ] **Step 4: Remove the interval clear in `closeBrowser()`**

In `closeBrowser()` (currently line 237), delete:

```ts
if (this.#keepAliveInterval !== null) clearInterval(this.#keepAliveInterval);
```

- [ ] **Step 5: Verify no dangling references**

Run: `rg -n "keepAlive|#keepAliveInterval" src/`
Expected: no matches.

- [ ] **Step 6: Typecheck, lint, and run the full suite**

Run: `yarn lint && yarn test`
Expected: PASS — tsc confirms no broken references; existing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add src/server/selenium/internal.ts
git commit -m "refactor(selenium): remove session keep-alive"
```

---

## Task 3: Add `ensureBrowser()` to the webdriver interface

Add the new method to the `CreeveyWebdriver` interface and a no-op default on the abstract base, so the worker (Task 5) can call it on any webdriver and the Playwright backend inherits the no-op unchanged.

**Files:**

- Modify: `src/types.ts` (interface at lines 162-169).
- Modify: `src/server/webdriver.ts` (`CreeveyWebdriverBase` class, line 53+).

**Interfaces:**

- Consumes: nothing.
- Produces: `CreeveyWebdriver.ensureBrowser(): Promise<boolean>` (interface) and `CreeveyWebdriverBase.ensureBrowser()` default returning `false`. Consumed by Task 4 (override) and Task 5 (worker call site).

- [ ] **Step 1: Add the method to the `CreeveyWebdriver` interface**

In `src/types.ts`, add `ensureBrowser` to the interface (after `getSessionId`, before `openBrowser`):

```ts
export interface CreeveyWebdriver {
  getSessionId(): Promise<string>;
  ensureBrowser(): Promise<boolean>;
  openBrowser(fresh?: boolean): Promise<CreeveyWebdriver | null>;
  closeBrowser(): Promise<void>;
  loadStoriesFromBrowser(): Promise<StoriesRaw>;
  switchStory(story: StoryInput, context: BaseCreeveyTestContext): Promise<CreeveyTestContext>;
  afterTest(test: ServerTest): Promise<void>;
}
```

- [ ] **Step 2: Add the no-op default to `CreeveyWebdriverBase`**

In `src/server/webdriver.ts`, inside `export abstract class CreeveyWebdriverBase implements CreeveyWebdriver {`, add the default method (e.g. right after the `abstract getSessionId()` declaration around line 65):

```ts
  /**
   * Ensures the browser session is alive before running a test. The default is
   * a no-op (returns false = "session was not recreated"). The Selenium
   * implementation overrides this to probe and lazily recreate reaped sessions.
   */
  async ensureBrowser(): Promise<boolean> {
    return false;
  }
```

- [ ] **Step 3: Typecheck and lint**

Run: `yarn lint`
Expected: PASS. This confirms `CreeveyWebdriverBase` still satisfies the interface, and the Playwright backend (which extends `CreeveyWebdriverBase`) inherits the default without edits.

- [ ] **Step 4: Verify the Playwright backend is unchanged but compliant**

Run: `rg -n "ensureBrowser" src/server/playwright/`
Expected: no matches (it inherits the no-op default). If any match appears, do NOT add an override — the default is correct for Playwright.

- [ ] **Step 5: Run the full suite**

Run: `yarn test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/server/webdriver.ts
git commit -m "feat(webdriver): add ensureBrowser liveness hook to interface"
```

---

## Task 4: Implement `SeleniumWebdriver.ensureBrowser()` (probe + gate + recovery)

The core of the design. Runs before each test; skips work when the session was used recently (activity gate); otherwise probes with `getTitle()`; on a session-dead error rebuilds the session in-process via the existing `openBrowser(true)`; escalates by throwing when rebuild fails.

**Files:**

- Modify: `src/server/selenium/webdriver.ts`.
- Test: `tests/seleniumSessionRecovery.test.ts` (extend with the `ensureBrowser` describe block).

**Interfaces:**

- Consumes: `isSessionDeadError` (dynamic-imported from `./internal.js`, produced in Task 1); existing `this.openBrowser(true)`, `this.#browser.browser.getTitle()`.
- Produces: `SeleniumWebdriver.ensureBrowser(): Promise<boolean>` — returns `true` when the session was recreated (so the worker refreshes its cached session id), `false` otherwise.

- [ ] **Step 1: Write the failing tests (gate, recovery, escalation)**

Append to `tests/seleniumSessionRecovery.test.ts`. The tests drive through the public API (`new SeleniumWebdriver(...)` + `openBrowser()`) with `InternalBrowser.getBrowser` mocked and fake timers controlling the activity gate. They keep the real `isSessionDeadError` via `vi.importActual`.

First, consolidate **all** imports at the top of the file. Replace the Task 1 import block with this merged set (adds `vi`/`beforeEach`/`afterEach`, the `Config` type, the `SeleniumWebdriver`/`InternalBrowser` value imports, and the `vi.mock` factory):

```ts
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { error } from 'selenium-webdriver';
import type { Config } from '../src/types.js';

import { isSessionDeadError, InternalBrowser } from '../src/server/selenium/internal.js';
import { SeleniumWebdriver } from '../src/server/selenium/webdriver.js';

// Mock ./internal.js so InternalBrowser.getBrowser returns fakes we control,
// while keeping the REAL isSessionDeadError (re-exported via importActual).
vi.mock('../src/server/selenium/internal.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/server/selenium/internal.js')>();
  return { ...actual, InternalBrowser: { getBrowser: vi.fn() } };
});

const { NoSuchSessionError } = error;
```

Notes:

- The `isSessionDeadError` import resolves to the real function because the mock factory spreads `...actual`.
- `src/server/selenium/webdriver.ts` dynamic-imports `./internal.js`, which resolves to the same mocked module, so the real `isSessionDeadError` and the stubbed `InternalBrowser.getBrowser` are used at runtime in the source under test too.
- All imports are at the top so ESLint `import/first` is satisfied.

Then append the helper and the new describe block at the end of the file (imports only at the top — nothing new here but declarations and tests):

```ts
const fakeConfig = {} as unknown as Config;

// A loose stand-in for InternalBrowser. We cast internally so call sites stay clean;
// the real class is replaced by the vi.mock above, so structural typing is enough.
function makeFakeInternalBrowser(opts: { getTitle: () => Promise<string>; sessionId?: string }): InternalBrowser {
  return {
    browser: {
      getTitle: opts.getTitle,
      getSession: () => Promise.resolve({ getId: () => opts.sessionId ?? 'session-1' }),
    },
    closeBrowser: vi.fn(),
  } as unknown as InternalBrowser;
}

describe('SeleniumWebdriver.ensureBrowser', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    vi.mocked(InternalBrowser.getBrowser).mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('skips the probe when the session was used recently (activity gate)', async () => {
    const getTitle = vi.fn().mockResolvedValue('https://storybook/iframe.html');
    vi.mocked(InternalBrowser.getBrowser).mockResolvedValueOnce(makeFakeInternalBrowser({ getTitle }));

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    // Only 1 second after open — well within the 30s gate.
    vi.setSystemTime(new Date('2026-01-01T00:00:01Z'));
    const recreated = await driver.ensureBrowser();

    expect(recreated).toBe(false);
    expect(getTitle).not.toHaveBeenCalled();
  });

  test('recreates the session in-process after a session-dead probe', async () => {
    const deadTitle = vi.fn().mockRejectedValueOnce(new NoSuchSessionError('session not found'));
    const deadBrowser = makeFakeInternalBrowser({ getTitle: deadTitle, sessionId: 'old' });

    const liveTitle = vi.fn().mockResolvedValue('https://storybook/iframe.html');
    const liveBrowser = makeFakeInternalBrowser({ getTitle: liveTitle, sessionId: 'new' });

    vi.mocked(InternalBrowser.getBrowser)
      .mockResolvedValueOnce(deadBrowser) // initial openBrowser
      .mockResolvedValueOnce(liveBrowser); // recreate via openBrowser(true)

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    // Advance past the 30s gate so the probe runs.
    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    const recreated = await driver.ensureBrowser();

    expect(recreated).toBe(true);
    expect(deadTitle).toHaveBeenCalledTimes(1);
    expect(vi.mocked(InternalBrowser.getBrowser)).toHaveBeenCalledTimes(2);
    // Session id now reflects the recreated session.
    expect(await driver.getSessionId()).toBe('new');
  });

  test('does not recreate on a non-session-dead probe error (rethrows as normal test error)', async () => {
    const getTitle = vi.fn().mockRejectedValueOnce(new Error('element click intercepted'));
    vi.mocked(InternalBrowser.getBrowser).mockResolvedValueOnce(makeFakeInternalBrowser({ getTitle }));

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    await expect(driver.ensureBrowser()).rejects.toThrow('element click intercepted');
    expect(vi.mocked(InternalBrowser.getBrowser)).toHaveBeenCalledTimes(1); // no recreate
  });

  test('escalates (throws) when recreate itself fails (grid refused a new session)', async () => {
    const deadTitle = vi.fn().mockRejectedValueOnce(new NoSuchSessionError('session not found'));
    vi.mocked(InternalBrowser.getBrowser)
      .mockResolvedValueOnce(makeFakeInternalBrowser({ getTitle: deadTitle })) // initial
      .mockResolvedValueOnce(null); // recreate returns null -> grid refused

    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    await driver.openBrowser();

    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    await expect(driver.ensureBrowser()).rejects.toThrow(/Failed to recreate session/);
  });

  test('does nothing when no browser is open', async () => {
    const driver = new SeleniumWebdriver('chrome', 'http://grid:4444', fakeConfig, false);
    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
    expect(await driver.ensureBrowser()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test tests/seleniumSessionRecovery.test.ts`
Expected: FAIL — `SeleniumWebdriver.ensureBrowser` is not a function (the override does not exist yet; the inherited no-op returns `false`, so the "recreates" test fails, and `getTitle` expectations fail).

- [ ] **Step 3: Implement `ensureBrowser`, the activity field, and the threshold constant**

In `src/server/selenium/webdriver.ts`:

Add a module-level exported constant near the top of the file (after the imports), with the documented rationale:

```ts
/**
 * Idle probe threshold. The liveness probe in `ensureBrowser` is skipped if the
 * session was used within this window, making recovery free during continuous
 * test runs. Must stay comfortably below typical grid idle timeouts
 * (Selenoid ~60s, Selenium Grid 4 ~300s). Not configurable — rely on grid defaults.
 */
export const IDLE_PROBE_THRESHOLD = 30_000;
```

Add a private activity field to the `SeleniumWebdriver` class (alongside the other `#` fields near lines 12-16):

```ts
#lastActivityAt = 0;
```

In `openBrowser`, stamp the activity timestamp after a browser is assigned. Update the block that sets `this.#browser` (currently lines 70-74) so it reads:

```ts
if (!browser) return null;

this.#browser = browser;
this.#lastActivityAt = Date.now();

return this;
```

Add the `ensureBrowser` override to the class (e.g. right after `getSessionId()`, around line 44):

```ts
  async ensureBrowser(): Promise<boolean> {
    if (!this.#browser) return false;
    if (Date.now() - this.#lastActivityAt < IDLE_PROBE_THRESHOLD) return false;

    this.#lastActivityAt = Date.now();

    try {
      // Cheap read-only command that round-trips to the grid; reveals a reaped session.
      await this.#browser.browser.getTitle();
      return false;
    } catch (error) {
      // Dynamic import preserves the optional-dependency lazy-load invariant.
      const { isSessionDeadError } = await import('./internal.js');
      if (!isSessionDeadError(error)) throw error;

      logger().info('Session appears dead; recreating...');
      // Reuses the existing close+rebuild+re-init path. openBrowser(true) discards
      // the dead InternalBrowser and builds a fresh one.
      if ((await this.openBrowser(true)) == null) {
        // Grid refused a new session; propagate so the worker classifies this as
        // subtype:'unknown' and the master kill+refork path engages.
        throw new Error('Failed to recreate session after it was reaped by the grid');
      }
      this.#lastActivityAt = Date.now();
      return true;
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test tests/seleniumSessionRecovery.test.ts`
Expected: PASS — all `isSessionDeadError` cases (Task 1) and all `ensureBrowser` cases (gate, recovery, non-rethrow, escalation, no-browser) green.

- [ ] **Step 5: Lint and typecheck**

Run: `yarn lint`
Expected: PASS. Run `yarn fix` if prettier reports formatting only.

- [ ] **Step 6: Run the full suite**

Run: `yarn test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/selenium/webdriver.ts tests/seleniumSessionRecovery.test.ts
git commit -m "feat(selenium): lazy session recovery via ensureBrowser probe"
```

---

## Task 5: Wire `ensureBrowser()` into the worker test handler

Call the probe before each test and refresh the worker's cached session id when recovery occurred. This is the glue that activates recovery for real test runs.

**Files:**

- Modify: `src/server/worker/start.ts` (lines 124-127 and the test-handler IIFE at lines 183-203).

**Interfaces:**

- Consumes: `webdriver.ensureBrowser()` (Task 3/4) and `webdriver.getSessionId()` (existing).
- Produces: worker behavior — every test first ensures the session is alive; `sessionId` in result payloads stays correct after a recreate.

- [ ] **Step 1: Make the captured `sessionId` reassignable**

In `src/server/worker/start.ts`, change the `const` destructuring (currently lines 124-127) to `let`:

```ts
const Webdriver = config.webdriver;
let [sessionId, webdriver] =
  (await setupWebdriver(new Webdriver(browser, gridUrl, config, options.debug ?? false))) ?? [];
```

(Only `sessionId` is reassigned, but array destructuring cannot mix `let`/`const`, so both use `let`. ESLint `prefer-const` does not fire because `sessionId` is reassigned.)

- [ ] **Step 2: Call `ensureBrowser()` at the top of the test try block**

In the test-handler IIFE (currently lines 183-203), insert the probe call as the first statement inside the existing `try {`, before `await Promise.race([...])`:

```ts
try {
  if (await webdriver.ensureBrowser()) {
    sessionId = await webdriver.getSessionId();
  }
  await Promise.race([
    new Promise(
      (_, reject) =>
        (timeout = setTimeout(() => {
          isRejected = true;
          reject(new Error(`Timeout of ${config.testTimeout}ms exceeded`));
        }, config.testTimeout)),
    ),
    (async () => {
      const context = await webdriver.switchStory(test.story, baseContext);
      await test.fn(context);
    })(),
  ]);
} catch (testError) {
  error = testError;
}
```

(Only the two `if (...) { sessionId = ... }` lines are new; the rest is the existing code shown for context.)

- [ ] **Step 3: Typecheck and lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 4: Run the full suite**

Run: `yarn test`
Expected: PASS. (The worker handler is exercised by integration rather than unit tests; its added logic is a thin delegation to the unit-tested `ensureBrowser`.)

- [ ] **Step 5: Commit**

```bash
git add src/server/worker/start.ts
git commit -m "feat(worker): ensure browser session before each test"
```

---

## Task 6: Documentation and memory sync

Update user-facing docs and the `memories/` knowledge base per the AGENTS.md memory-sync rule.

**Files:**

- Modify: `docs/grid.md`.
- Modify: `memories/architecture.md`.
- Modify: `memories/troubleshooting.md`.
- Modify: `memories/memory.md`.

**Interfaces:**

- Consumes: the finalized behavior from Tasks 1-5.
- Produces: accurate documentation of the idle-session / recovery model.

- [ ] **Step 1: Document the idle-session behavior in `docs/grid.md`**

Append a new section at the end of `docs/grid.md`:

```markdown
## Idle sessions and billing

Creevey does **not** hold Selenium sessions open while idle. When running in UI mode, each worker's session is reaped by the grid after the grid's own idle timeout (Selenoid ~60s, Selenium Grid 4 ~300s, vendors vary). When you trigger a run after idle, Creevey transparently recreates the session and continues — you will see a short delay on the first test after inactivity, then tests run normally.

For services that bill by session running time, this means you are only billed for active test runs plus the short idle-timeout window. To maximize savings, keep your grid's idle/session timeout modest (e.g. set `sessionTimeout` via `seleniumCapabilities` or your grid config). Creevey recovers regardless of the timeout value.
```

- [ ] **Step 2: Update `memories/architecture.md`**

In the Selenium Webdriver section (around line 78-88), add a note about the new method and recovery model. Append to that section:

```markdown
**Session lifecycle**: `SeleniumWebdriver.ensureBrowser()` (added 2026-07-25) is invoked by the worker before each test. It runs an activity-gated liveness probe (`getTitle()`); if the session was reaped by the grid it recreates the session in-process via `openBrowser(true)`, escalating to the master kill+refork path only if rebuild fails. There is no longer a keep-alive ping — idle sessions die per the grid's own timeout and are lazily recovered. `isSessionDeadError` (in `internal.ts`) classifies reaped-session errors. The Playwright backend inherits the no-op default.
```

- [ ] **Step 3: Update `memories/troubleshooting.md`**

Add a short diagnostic note (in the Selenium/connection-errors area):

```markdown
**Session recreated after idle (UI mode)**: By design, idle Selenium sessions are reaped by the grid. When a test runs after inactivity, the worker logs `Session appears dead; recreating...` and rebuilds the session in-process. If you see this log repeatedly during active runs, the grid may be killing sessions prematurely — check the grid's `sessionTimeout`/idle timeout. If recreation itself fails, the worker emits `subtype:'unknown'` and the master kills+reforks the worker (existing behavior).
```

- [ ] **Step 4: Update `memories/memory.md`**

Add a concise entry to the high-level narrative (near the webdriver/feature notes):

```markdown
- Selenium sessions are no longer kept alive during idle (removed keep-alive). Idle sessions are reaped by the grid and lazily recreated via `ensureBrowser()` on the next test (in-process, with master kill+refork escalation on failure). UI-mode grid spend now limited to active runs + grid idle timeout.
```

- [ ] **Step 5: Lint (markdown is covered by prettier in lint-staged)**

Run: `yarn lint`
Expected: PASS (or run `yarn fix` for markdown formatting).

- [ ] **Step 6: Commit**

```bash
git add docs/grid.md memories/architecture.md memories/troubleshooting.md memories/memory.md
git commit -m "docs: document selenium lazy session recovery"
```

---

## Final Verification

- [ ] **Full lint + tests**: `yarn lint && yarn test` — all green.
- [ ] **Manual smoke (UI mode, optional but recommended)**: start a Selenium grid (or use a remote grid-as-a-service), run `yarn creevey test --ui`, run one test, then wait longer than the grid's idle timeout, then run a second test. Expect: a `Session appears dead; recreating...` log on the second run, then the test passes; and confirm (via grid dashboard or `curl <grid>/status`) that no session exists during the idle gap.
- [ ] **CI parity**: run a normal `yarn creevey test` (non-UI) suite and confirm no behavioral regression (the activity gate suppresses probes during continuous runs).

## Success Criteria (from the spec)

- No WebDriver traffic is generated while a UI-mode worker is idle between user-triggered runs.
- After a grid reaps an idle session, the next test run transparently recreates the session and passes, with a visible `Session appears dead; recreating...` log line and no user-visible error.
- Continuous CI runs and rapid UI batches incur no per-test probe (activity gate suppresses it).
- Persistent recovery failures escalate to worker kill+refork with `subtype:'unknown'`, matching existing behavior.
- The Playwright backend, master API, WebSocket protocol, and React UI are untouched.
