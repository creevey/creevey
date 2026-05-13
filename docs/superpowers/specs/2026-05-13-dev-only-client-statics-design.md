# Design: Dev-Only Client Statics Bootstrap

**Date:** 2026-05-13  
**Status:** Approved  
**Goal:** Keep on-demand client UI builds for source-checkout local development while removing that fallback from production server/runtime code.

## Problem

`ensureClientStatics()` currently lives in `src/server/utils.ts` and is called from runtime server flows:

- `src/server/master/start.ts`
- `src/server/report.ts`
- `copyStatics()` in `src/server/utils.ts`

That makes production-oriented server code responsible for building the Vite UI bundle on demand when `dist/client/web/index.html` is missing.

This is unnecessary for the published package because the package is built before publish. The fallback exists to support repo-local execution via `tsx ./src/cli`, where the server still expects the built client assets in `dist/client/web`.

The current placement mixes two responsibilities:

- production/runtime asset consumption
- local development bootstrap behavior

## Selected Approach

Move the on-demand build fallback to a dev-only bootstrap path at the CLI layer.

Production/runtime code will only consume already-built client statics. Repo-local execution will preserve the existing convenience by building the UI bundle before entering server flows when needed.

## Why This Boundary Fits

There are two distinct execution modes in this repo:

1. **Repo-local development**

   - `package.json` script `creevey` runs `tsx ./src/cli`
   - source files are executed directly
   - `dist/client/web` may not exist yet

2. **Published package usage**
   - `package.json.bin` points to `dist/cli.js`
   - package is built before publish
   - client statics should already be present in the packed artifact

The CLI boundary is the cleanest place to keep repo-local bootstrap logic without keeping that behavior in operational server modules.

## Architecture

### Before

```text
CLI
  -> server/report or server/start
       -> ensureClientStatics()
            -> maybe vite build
       -> serve/copy dist/client/web
```

### After

```text
Repo-local CLI
  -> dev-only ensure client statics
       -> maybe vite build
  -> server/report or server/start
       -> require dist/client/web

Published CLI
  -> server/report or server/start
       -> require dist/client/web
```

## Code Changes

### 1. Remove build-on-demand logic from server utilities

`src/server/utils.ts` will no longer export `ensureClientStatics()`.

It will retain `getClientDir()` and introduce a strict accessor for runtime usage, for example:

- `getRequiredClientDir()`

Behavior:

- resolve `dist/client/web`
- verify `index.html` exists
- return the directory if present
- otherwise throw a clear error instructing the operator to run `yarn build` or `yarn build:client`

This keeps runtime assumptions explicit.

### 2. Add a dev-only bootstrap helper

Create a new module outside the server runtime path, for example:

- `src/dev/ensure-client-statics.ts`

Behavior:

- resolve `dist/client/web/index.html`
- return immediately when present
- otherwise run Vite build using the existing project `vite.config.mts`
- verify the build output exists
- throw a clear error if the build fails

This module owns the current fallback logic and is only used by repo-local source execution.

### 3. Move the fallback call to the CLI layer

Update `src/creevey.ts` so that before invoking `creevey(command, options)`, it conditionally runs the dev-only helper when:

- command is `report`, or
- command is `test` and `options.ui === true`

This preserves the current user-facing local-dev behavior:

- `yarn creevey report`
- `yarn creevey test --ui`

Both will still build the client UI on demand from a source checkout.

### 4. Update server call sites to use strict asset access

Replace `ensureClientStatics()` usages in:

- `src/server/report.ts`
- `src/server/master/start.ts`
- `copyStatics()` in `src/server/utils.ts`

with the strict runtime accessor or equivalent non-building path.

Server code will no longer import Vite or attempt builds.

## Files Changed

| File                               | Action | Reason                                                     |
| ---------------------------------- | ------ | ---------------------------------------------------------- |
| `src/server/utils.ts`              | Update | Remove runtime fallback build, add strict statics accessor |
| `src/server/report.ts`             | Update | Stop invoking build-on-demand from runtime flow            |
| `src/server/master/start.ts`       | Update | Stop invoking build-on-demand from runtime flow            |
| `src/creevey.ts`                   | Update | Add repo-local bootstrap before entering server flows      |
| `src/dev/ensure-client-statics.ts` | Create | Hold local-dev-only Vite build fallback                    |

## Behavior Changes

### Local Development

- Running `yarn creevey report` in a source checkout without `dist/client/web` will build the UI bundle automatically, then continue.
- Running `yarn creevey test --ui` in a source checkout without `dist/client/web` will do the same.
- Non-UI flows will not trigger client builds.

### Published / Production Runtime

- Runtime code will never build the UI bundle on demand.
- Missing `dist/client/web/index.html` becomes a packaging or installation error.
- The error message should explain that the package is missing required client assets and should suggest `yarn build` or `yarn build:client` for source checkouts.

## Error Handling

### Dev Bootstrap Failure

If the on-demand build fails:

- surface the original Vite failure reason
- prefix it with a Creevey-specific message such as `Failed to build Creevey web UI`

### Runtime Missing Assets

If runtime code cannot find `dist/client/web/index.html`:

- fail immediately
- use a deterministic message
- make it obvious that runtime is not expected to build assets

## Testing

### Manual Verification

1. Remove `dist/client/web`
2. Run `yarn creevey report`
3. Verify the UI bundle is built automatically and the server starts
4. Remove `dist/client/web` again
5. Run `yarn creevey test --ui`
6. Verify the UI bundle is built automatically and UI mode starts
7. Run a non-UI command and verify it does not build the client bundle
8. Run the built/package-style path and verify no runtime build logic is invoked

### Regression Checks

- Report generation still copies built assets into `reportDir`
- UI mode still serves the same `dist/client/web` output
- Server modules no longer depend on Vite build behavior

## Trade-offs

### Benefits

- Production/runtime server code becomes simpler and more explicit
- Local-dev convenience is preserved
- Build fallback responsibility moves to the correct boundary
- Packaging problems are exposed instead of silently repaired at runtime

### Costs

- The CLI layer gains a small amount of environment-specific bootstrap logic
- The codebase now has two related helpers: one strict runtime accessor and one dev bootstrap helper

This is acceptable because the responsibilities are now clearly separated.

## Alternatives Considered

### Keep the fallback in runtime guarded by environment

Rejected because production code would still contain the build-on-demand path, which does not meet the goal.

### Add a separate dev CLI command

Rejected because it changes the local workflow more than necessary. The selected approach preserves existing commands.

## Rollback Plan

If the separation causes issues:

1. Restore `ensureClientStatics()` in `src/server/utils.ts`
2. Reintroduce runtime calls in `report.ts`, `start.ts`, and `copyStatics()`
3. Remove the CLI bootstrap helper

## Success Criteria

- Local source-checkout UI flows still auto-build client statics when missing
- Published/runtime server code does not perform on-demand Vite builds
- Missing client statics in runtime fail clearly and immediately
- Existing UI and report behavior remains otherwise unchanged
