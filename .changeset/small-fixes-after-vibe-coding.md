---
'creevey': patch
---

Small fixes after vibe-coding

## Changes

### Package Exports Cleanup

- **`package.json`**: Added proper export path for `"./playwright-reporter"`
- **`src/playwright-reporter.ts`**: Created dedicated entry point file for Playwright reporter
- **`src/playwright.ts`**: Removed `CreeveyPlaywrightReporter` export to avoid duplication
- **`scripts/dist/playwright.d.ts`**: Cleaned up TypeScript declarations

### Import Path Corrections

- **`src/server/playwright/reporter.ts`**: Fixed relative import paths to use proper module paths
  - Updated imports for `TestsManager`, `CreeveyApi`, and utilities
  - Ensures proper module resolution across the codebase

### Documentation Updates

- **`docs/playwright-reporter.md`**: Updated to use string-based reporter configuration
  - Changed from import-based usage to simpler string path: `'creevey/playwright-reporter'`
  - Removed unnecessary import statements from examples
- **`docs/examples/playwright-reporter-example.ts`**: Applied consistent string-based reporter usage

### Storybook Integration

- **`.storybook/preview.tsx`**: Added missing `isUpdateMode: false` to context provider
  - Ensures Storybook preview works correctly with updated context interface

### Benefits

- **Simplified usage**: Playwright reporter can now be used with just a string path
- **Better module organization**: Clear separation between main exports and reporter-specific exports
- **Consistent API**: Aligns with Playwright's recommended reporter configuration patterns
- **Reduced import complexity**: No need to import the reporter class explicitly

These fixes improve the developer experience when using the Playwright reporter and ensure proper module resolution across different environments.
