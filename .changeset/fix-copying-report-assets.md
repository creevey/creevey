---
'creevey': patch
---

Fix copying report assets

## Changes

### Report Asset Handling

- **`src/server/master/start.ts`**: Fixed report asset copying logic
  - Changed to copy assets from `clientDir/assets` instead of all files from `clientDir`
  - Creates proper `assets` directory structure in report output
  - Copies `index.html` to report root and handles asset files separately
  - Ensures correct file structure for generated reports

### Import Optimizations

- **Multiple files**: Changed imports to type-only imports for better TypeScript compilation
  - `Args` from `@storybook/csf` in playwright/selenium webdriver files
  - `Parameters` from `@storybook/csf` in shared index
  - Improves build performance by avoiding unnecessary runtime imports

This fix ensures that report assets are copied to the correct directory structure, making generated HTML reports properly functional with their CSS and JavaScript assets.
