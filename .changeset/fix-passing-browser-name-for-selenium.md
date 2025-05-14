---
'creevey': patch
---

Fix passing browser name for selenium

## Changes

### Browser Configuration Restructuring

- **`.creevey/browsers/ie11.mts`**: Moved browser-specific options into `seleniumCapabilities` wrapper to properly structure configuration for selenium grid

### Selenium Integration Fix

- **`src/server/selenium/internal.ts`**: Fixed critical issue where browser name wasn't being correctly passed to selenium capabilities
  - Now properly extracts `browserName` from browser config and passes it to capabilities
  - Improved parameter naming from `browserName` to `browser` for clarity
  - Enhanced error handling and logging

### Test Reporting Improvements

- **`src/server/reporter.ts`**: Enhanced test logging to show duration for both test start (`TEST_BEGIN`) and completion (`TEST_PASS`) events

### Playwright Adjustments

- **`src/server/playwright/internal.ts`**: Removed redundant default navigation timeout setting (kept default timeout at 60s)

### Code Quality

- Added TODO comments for future improvements regarding page load timeouts and Promise.race optimization in webdriver resolution
