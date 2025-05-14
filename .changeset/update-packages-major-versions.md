---
'creevey': minor
---

# Update packages to major versions

This release includes significant updates to multiple dependencies and internal changes to support the new major versions.

## Breaking Changes

### Package Updates

- **@koa/cors**: `3.x` → `5.0.0`
- **@octokit/core**: `4.x` → `6.1.2`
- **chokidar**: `3.x` → `4.0.1`
- **uuid**: `10.x` → `11.0.2`
- **typescript**: `5.5.x` → `5.6.3`

### Script Changes

- Replaced `rimraf` with native `rm -rf` in clean script
- Updated `postbuild` script to use direct file copy instead of `cpx`
- Simplified `chromatic` command

### Code Changes

- **Dynamic Imports**: Converted several static imports to dynamic imports:

  - `pixelmatch` in `match-image.ts`
  - `@octokit/core` in `selenoid.ts`
  - `find-cache-dir` in `utils.ts`
  - `yocto-spinner` replacing `ora` in `docker.ts`

- **Async Function Updates**:

  - `getCreeveyCache()` is now async
  - `getMatchers()` is now async
  - Updated corresponding function calls with `await`

- **Import Path Updates**:
  - Added `.js` extensions to several import paths
  - Updated story imports to use `.js` extensions

### Configuration Changes

- Added `tsconfig.prod.tsbuildinfo` to `.gitignore` and `.npmignore`
- Simplified Husky pre-commit hook to only run `yarn lint-staged`

## Migration Notes

These changes may require updates to your configuration if you're extending or customizing Creevey. Pay particular attention to:

1. Any custom scripts that might have depended on the old package versions
2. Import statements that may need `.js` extensions
3. Async/await handling if you're calling the updated functions directly

The dynamic imports improve performance by reducing initial bundle size, but may affect bundling strategies in some environments.
