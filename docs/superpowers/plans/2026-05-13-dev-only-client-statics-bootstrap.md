# Dev-Only Client Statics Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep on-demand UI bundle builds for repo-local `yarn creevey report` and `yarn creevey test --ui`, while removing build-on-demand behavior from production server/runtime code.

**Architecture:** Move the Vite build fallback out of `src/server/*` and into a dev-only bootstrap helper called from `src/creevey.ts` before UI entrypoints run. Server/runtime code will switch to a strict client-statics accessor that only reads `dist/client/web` and fails clearly when assets are missing.

**Tech Stack:** TypeScript, Node.js `fs`/`path`, Vite, Vitest

---

## Files Changed

| File                                    | Action | Purpose                                                            |
| --------------------------------------- | ------ | ------------------------------------------------------------------ |
| `src/server/utils.ts`                   | Modify | Replace runtime build fallback with strict client statics accessor |
| `src/server/report.ts`                  | Modify | Remove runtime call to build client statics                        |
| `src/server/master/start.ts`            | Modify | Remove runtime call to build client statics                        |
| `src/creevey.ts`                        | Modify | Add CLI-side dev bootstrap for UI flows                            |
| `src/dev/ensure-client-statics.ts`      | Create | Hold dev-only Vite build-on-demand helper                          |
| `tests/utils.test.ts`                   | Modify | Add tests for strict runtime accessor                              |
| `tests/dev/ensureClientStatics.test.ts` | Create | Add tests for dev-only bootstrap helper                            |
| `memories/memory.md`                    | Modify | Update project memory to reflect new local-dev/runtime split       |

---

### Task 1: Add a strict runtime accessor for built client statics

**Files:**

- Modify: `src/server/utils.ts`
- Modify: `tests/utils.test.ts`

- [ ] **Step 1: Write the failing tests for strict runtime statics lookup**

Add to `tests/utils.test.ts` near the top with the existing imports:

```ts
import fs from 'fs';
import path from 'path';
```

Update the existing utils import:

```ts
import { getClientDir, getRequiredClientDir, shouldSkip } from '../src/server/utils.js';
```

Append this new block to `tests/utils.test.ts` after the `shouldSkip` tests:

```ts
describe('getRequiredClientDir', () => {
  const clientDir = getClientDir();
  const indexHtml = path.join(clientDir, 'index.html');
  const backupHtml = path.join(clientDir, 'index.html.test-backup');
  const hadIndexHtml = fs.existsSync(indexHtml);

  const cleanupIndexHtml = (): void => {
    if (fs.existsSync(backupHtml)) {
      fs.renameSync(backupHtml, indexHtml);
      return;
    }

    if (!hadIndexHtml && fs.existsSync(indexHtml)) {
      fs.unlinkSync(indexHtml);
    }
  };

  test('returns client dir when built statics exist', () => {
    if (!hadIndexHtml) {
      fs.mkdirSync(clientDir, { recursive: true });
      fs.writeFileSync(indexHtml, '<!doctype html>');
    }

    expect(getRequiredClientDir()).toBe(clientDir);

    cleanupIndexHtml();
  });

  test('throws a clear error when built statics are missing', () => {
    if (fs.existsSync(indexHtml)) {
      fs.renameSync(indexHtml, backupHtml);
    }

    try {
      expect(() => getRequiredClientDir()).toThrow(
        'Creevey web UI assets are missing. Run `yarn build` or `yarn build:client` before starting UI mode.',
      );
    } finally {
      cleanupIndexHtml();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
yarn test tests/utils.test.ts
```

Expected: FAIL because `getRequiredClientDir` is not exported yet.

- [ ] **Step 3: Implement the strict runtime accessor in `src/server/utils.ts`**

Replace the current client statics section in `src/server/utils.ts` with:

```ts
export function getClientDir(): string {
  return path.join(path.dirname(fileURLToPath(importMetaUrl)), '../../dist/client/web');
}

export function getRequiredClientDir(): string {
  const clientDir = getClientDir();
  const indexHtml = path.join(clientDir, 'index.html');

  if (fs.existsSync(indexHtml)) return clientDir;

  throw new Error(
    'Creevey web UI assets are missing. Run `yarn build` or `yarn build:client` before starting UI mode.',
  );
}
```

Delete the old `ensureClientStatics()` implementation entirely.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
yarn test tests/utils.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/utils.ts tests/utils.test.ts
git commit -m "refactor: require built client statics at runtime"
```

---

### Task 2: Add the dev-only on-demand client statics bootstrap helper

**Files:**

- Create: `src/dev/ensure-client-statics.ts`
- Create: `tests/dev/ensureClientStatics.test.ts`

- [ ] **Step 1: Write the failing tests for the dev helper**

Create `tests/dev/ensureClientStatics.test.ts`:

```ts
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const build = vi.fn();

vi.mock('vite', () => ({
  build,
}));

import { ensureClientStaticsForLocalDev } from '../../src/dev/ensure-client-statics.js';
import { getClientDir } from '../../src/server/utils.js';

describe('ensureClientStaticsForLocalDev', () => {
  const clientDir = getClientDir();
  const indexHtml = path.join(clientDir, 'index.html');
  const backupHtml = path.join(clientDir, 'index.html.dev-test-backup');
  const hadIndexHtml = fs.existsSync(indexHtml);

  const cleanupIndexHtml = (): void => {
    if (fs.existsSync(backupHtml)) {
      fs.renameSync(backupHtml, indexHtml);
      return;
    }

    if (!hadIndexHtml && fs.existsSync(indexHtml)) {
      fs.unlinkSync(indexHtml);
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupIndexHtml();
  });

  test('returns immediately when built statics already exist', async () => {
    if (!hadIndexHtml) {
      fs.mkdirSync(clientDir, { recursive: true });
      fs.writeFileSync(indexHtml, '<!doctype html>');
    }

    await expect(ensureClientStaticsForLocalDev()).resolves.toBe(clientDir);
    expect(build).not.toHaveBeenCalled();
  });

  test('runs vite build when built statics are missing', async () => {
    if (fs.existsSync(indexHtml)) {
      fs.renameSync(indexHtml, backupHtml);
    }

    build.mockImplementation(async () => {
      fs.mkdirSync(clientDir, { recursive: true });
      fs.writeFileSync(indexHtml, '<!doctype html>');
    });

    await expect(ensureClientStaticsForLocalDev()).resolves.toBe(clientDir);
    expect(build).toHaveBeenCalledTimes(1);
  });

  test('throws a clear error when vite build does not produce index.html', async () => {
    if (fs.existsSync(indexHtml)) {
      fs.renameSync(indexHtml, backupHtml);
    }

    build.mockResolvedValue(undefined);

    await expect(ensureClientStaticsForLocalDev()).rejects.toThrow(
      /Failed to build Creevey web UI: .*index\.html was not created/,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
yarn test tests/dev/ensureClientStatics.test.ts
```

Expected: FAIL because `src/dev/ensure-client-statics.ts` does not exist yet.

- [ ] **Step 3: Create `src/dev/ensure-client-statics.ts`**

Write `src/dev/ensure-client-statics.ts`:

```ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'vite';
import { logger } from '../server/logger.js';
import { getClientDir } from '../server/utils.js';

const importMetaUrl = import.meta.url;

export async function ensureClientStaticsForLocalDev(): Promise<string> {
  const clientDir = getClientDir();
  const indexHtml = path.join(clientDir, 'index.html');

  if (fs.existsSync(indexHtml)) return clientDir;

  logger().info('Building Creevey web UI...');

  try {
    await build({
      configFile: path.join(path.dirname(fileURLToPath(importMetaUrl)), '../../vite.config.mts'),
      logLevel: 'error',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build Creevey web UI: ${errorMessage}`);
  }

  if (!fs.existsSync(indexHtml)) {
    throw new Error(`Failed to build Creevey web UI: ${indexHtml} was not created`);
  }

  return clientDir;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
yarn test tests/dev/ensureClientStatics.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/dev/ensure-client-statics.ts tests/dev/ensureClientStatics.test.ts
git commit -m "feat: add local dev client statics bootstrap"
```

---

### Task 3: Move UI bootstrap to the CLI boundary

**Files:**

- Modify: `src/creevey.ts`
- Test: `tests/dev/ensureClientStatics.test.ts`

- [ ] **Step 1: Extend the test file with a pure command predicate test**

Append this block to `tests/dev/ensureClientStatics.test.ts`:

```ts
import { shouldEnsureClientStaticsForCommand } from '../../src/dev/ensure-client-statics.js';

describe('shouldEnsureClientStaticsForCommand', () => {
  test('returns true for report', () => {
    expect(shouldEnsureClientStaticsForCommand('report', { ui: true })).toBe(true);
  });

  test('returns true for test ui mode', () => {
    expect(shouldEnsureClientStaticsForCommand('test', { ui: true })).toBe(true);
  });

  test('returns false for non-ui test mode', () => {
    expect(shouldEnsureClientStaticsForCommand('test', { ui: false })).toBe(false);
  });

  test('returns false for worker', () => {
    expect(shouldEnsureClientStaticsForCommand('worker', { ui: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
yarn test tests/dev/ensureClientStatics.test.ts
```

Expected: FAIL because `shouldEnsureClientStaticsForCommand` does not exist yet.

- [ ] **Step 3: Add the command predicate and wire it into `src/creevey.ts`**

Update `src/dev/ensure-client-statics.ts` to export this function above `ensureClientStaticsForLocalDev`:

```ts
export function shouldEnsureClientStaticsForCommand(
  command: 'report' | 'test' | 'worker',
  options: { readonly ui?: boolean },
): boolean {
  return command === 'report' || (command === 'test' && options.ui === true);
}
```

Update `src/creevey.ts` imports:

```ts
import { ensureClientStaticsForLocalDev, shouldEnsureClientStaticsForCommand } from './dev/ensure-client-statics.js';
```

Then replace the final line:

```ts
void creevey(command, options);
```

with:

```ts
const start = async (): Promise<void> => {
  if (cluster.isPrimary && v.is(OptionsSchema, options) && shouldEnsureClientStaticsForCommand(command, options)) {
    await ensureClientStaticsForLocalDev();
  }

  await creevey(command, options);
};

void start();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
yarn test tests/dev/ensureClientStatics.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/creevey.ts src/dev/ensure-client-statics.ts tests/dev/ensureClientStatics.test.ts
git commit -m "refactor: move client statics bootstrap to cli"
```

---

### Task 4: Remove runtime build-on-demand calls from server flows

**Files:**

- Modify: `src/server/report.ts`
- Modify: `src/server/master/start.ts`
- Modify: `src/server/utils.ts`

- [ ] **Step 1: Update runtime imports and calls**

In `src/server/report.ts`, replace:

```ts
import { ensureClientStatics, shutdownWorkers } from './utils.js';
```

with:

```ts
import { getRequiredClientDir, shutdownWorkers } from './utils.js';
```

Replace:

```ts
await ensureClientStatics();
```

with:

```ts
getRequiredClientDir();
```

In `src/server/master/start.ts`, replace:

```ts
import { shutdownWorkers, testsToImages, readDirRecursive, copyStatics, ensureClientStatics } from '../utils.js';
```

with:

```ts
import { shutdownWorkers, testsToImages, readDirRecursive, copyStatics, getRequiredClientDir } from '../utils.js';
```

Replace:

```ts
if (options.ui) await ensureClientStatics();
```

with:

```ts
if (options.ui) getRequiredClientDir();
```

In `src/server/utils.ts`, update `copyStatics()` so the first line becomes:

```ts
const clientDir = getRequiredClientDir();
```

- [ ] **Step 2: Run targeted tests**

Run:

```bash
yarn test tests/utils.test.ts tests/dev/ensureClientStatics.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/server/report.ts src/server/master/start.ts src/server/utils.ts tests/utils.test.ts tests/dev/ensureClientStatics.test.ts
git commit -m "refactor: remove runtime ui build fallback"
```

---

### Task 5: Update memories for the new dev/runtime split

**Files:**

- Modify: `memories/memory.md`

- [ ] **Step 1: Update the project memory**

Replace the current note about server startup building missing UI assets with:

```md
- The Creevey UI server serves the built Vite bundle from `dist/client/web`; published/runtime server flows require those assets to already exist and now fail clearly if they are missing
- Repo-local CLI execution via `yarn creevey report` and `yarn creevey test --ui` keeps a dev-only bootstrap that builds the client bundle on demand before entering UI server flows
```

- [ ] **Step 2: Commit**

```bash
git add memories/memory.md
git commit -m "docs: update memory for client statics bootstrap split"
```

---

## Verification Steps

After all commits are complete:

- [ ] Run the targeted unit tests:

```bash
yarn test tests/utils.test.ts tests/dev/ensureClientStatics.test.ts
```

Expected: PASS.

- [ ] Run the full test suite:

```bash
yarn test
```

Expected: PASS.

- [ ] Run lint:

```bash
yarn lint
```

Expected: PASS.

- [ ] Manual local-dev verification from a source checkout with missing client bundle:

```bash
rm -rf dist/client/web
yarn creevey report
```

Expected: logs `Building Creevey web UI...`, rebuilds `dist/client/web`, then starts report UI.

- [ ] Manual local-dev UI test verification:

```bash
rm -rf dist/client/web
yarn creevey test --ui
```

Expected: logs `Building Creevey web UI...`, rebuilds `dist/client/web`, then starts UI mode.

- [ ] Verify non-UI flow does not build the UI bundle:

```bash
rm -rf dist/client/web
yarn creevey test
```

Expected: no `Building Creevey web UI...` log line. Command behavior should proceed according to normal non-UI prerequisites.

---

## Spec Coverage Checklist

| Spec Requirement                                                   | Task                         |
| ------------------------------------------------------------------ | ---------------------------- |
| Remove build-on-demand logic from runtime server utilities         | Task 1, Task 4               |
| Add dev-only bootstrap helper outside server runtime path          | Task 2                       |
| Call the helper from `src/creevey.ts` for `report` and `test --ui` | Task 3                       |
| Preserve local-dev on-demand build behavior                        | Task 2, Task 3, Verification |
| Make runtime fail clearly when client statics are missing          | Task 1, Task 4               |
| Update project memory for the new behavior                         | Task 5                       |

---

## Placeholder Scan

- No `TBD`, `TODO`, or deferred implementation text in tasks.
- All file paths are exact.
- Every code-changing step includes concrete code.
- Every test/verification step includes exact commands and expected outcomes.

---

## Rollback Instructions

If the split causes regressions:

```bash
git revert <task-5-commit>
git revert <task-4-commit>
git revert <task-3-commit>
git revert <task-2-commit>
git revert <task-1-commit>
```

That restores the previous server-owned `ensureClientStatics()` flow.
