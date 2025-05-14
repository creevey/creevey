---
'creevey': patch
---

Update deps

## Changes

### Major Dependency Updates

- **Storybook packages**: Updated from `8.4.7` to `8.5.8`
  - Includes all `@storybook/*` packages (addon-actions, addon-backgrounds, addon-controls, etc.)
  - Updated peer dependencies to match new version requirements
- **TypeScript ESLint**: Updated from `8.19.1` to `8.24.1`
  - `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, and related packages

### Other Dependency Updates

- `@octokit/core`: `^6.1.3` → `^6.1.4`
- `@storybook/icons`: `^1.3.0` → `^1.3.2`
- Various other packages updated to latest versions

### Configuration Improvements

- **`.storybook/main.ts`**: Enhanced TypeScript configuration
  - Added proper imports for `StorybookConfig` and `mergeConfig`
  - Added `viteFinal` function to allow Docker hosts configuration
- **`.storybook/package.json`**: Added with `"type": "module"` for ES module support

### Code Enhancements

- **`src/server/docker.ts`**: Improved progress handling with nullish coalescing operator
- **`src/server/playwright/docker-file.ts`**: Reordered commands to install `playwright-core` before running playwright install
- **`src/server/playwright/internal.ts`**: Added console logging and enhanced error handling
  - Console messages now logged when debug mode is enabled
  - Better error handling for closed pages

This update ensures compatibility with the latest versions of core dependencies while maintaining functionality and improving debugging capabilities.
