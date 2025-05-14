---
'creevey': minor
---

Standalone playwright

## Changes

### Standalone Playwright Support

- **Added support for running Playwright without Docker** when `useDocker: false`
- Changed peer dependency from `playwright` to `playwright-core` for better compatibility
- Introduced `creevey://` protocol for direct browser launching in standalone mode

### Browser Type Resolution

- **`src/server/utils.ts`**: Added `resolvePlaywrightBrowserType` function with comprehensive browser mapping
  - Supports chromium, chrome, chrome-beta, msedge, firefox, webkit, and more
  - Moved from docker-file.ts for better reusability

### Enhanced Docker Detection

- Improved `isInsideDocker` detection to include `DOCKER=true` environment variable
- Better handling of containerized vs standalone environments

### Playwright Improvements

- **`src/server/playwright/internal.ts`**: Major enhancements
  - Added support for direct browser launching (standalone mode)
  - Improved Vite integration with reload handling
  - Better URL checking using separate pages
  - Removed retry logic from story loading for more predictable behavior
  - Enhanced logging throughout the browser initialization process
  - Added placeholder support for tracing functionality

### Code Quality Improvements

- **Inlined CSF utilities**: Moved `toId` and `storyNameFromExport` from @storybook/csf imports to local implementations
- **Type-only imports**: Converted runtime imports to type-only where possible for better build performance
- **Fixed report assets path**: Updated path resolution for built assets in report generation

### Configuration Updates

- **`.creevey/base.config.mts`**: Simplified Docker usage logic
- **`.storybook/preview.tsx`**: Added missing context properties for CreeveyContext
- **GitHub Actions**: Added build step before running tests

### Browser Configuration

- **Enhanced `playwrightOptions`**: Added support for tracing configuration with screenshots, snapshots, and sources

This major update enables Creevey to run Playwright browsers either in Docker containers or as standalone processes, providing more flexibility in different deployment scenarios while improving the overall reliability and performance of the testing framework.
