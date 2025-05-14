---
'creevey': minor
---

Add Playwright WebDriver support

This release introduces comprehensive Playwright WebDriver support alongside the existing Selenium WebDriver functionality, providing users with more options for browser automation.

### New Features

- **Playwright WebDriver**: Added `PlaywrightWebdriver` class with full support for browser automation
- **Dual WebDriver Support**: Both Selenium and Playwright drivers can now be used interchangeably
- **Docker Integration**: Added Playwright Docker container support with automatic image building
- **Grid URL Support**: Added `gridUrl` configuration option for WebDriver grids

### Configuration Changes

- Added `webdriver` property to `CreeveyConfig` (defaults to `SeleniumWebdriver`)
- Added `storiesProvider` property to default configuration
- Updated base config to support `PlaywrightWebdriver` import
- Browser name changed from 'chrome' to 'chromium' for Playwright compatibility

### Dependencies

- Added `playwright` and `selenium-webdriver` as optional peer dependencies
- Added `get-port` and `playwright-core` as dependencies
- Updated `selenium-webdriver` to version `^4.26.0`
- Added type definitions for `semver` and `tar-stream`

### File Structure Changes

- Moved story providers from `src/server/storybook/providers/` to `src/server/providers/`
- Moved `connection.ts` from `src/server/storybook/` to `src/server/`
- Removed unused Selenium browser implementation files
- Added new Playwright implementation files

### API Changes

- `loadStories` functions now accept an additional `webdriver` parameter
- `startWebdriverServer` function updated to handle both Selenium and Playwright
- Enhanced Docker functionality with new `buildImage` function

### Improvements

- Simplified shutdown handling in main entry point
- Enhanced error handling and logging throughout the codebase
- Updated telemetry to use consistent browser naming
- Streamlined utility functions and removed unused code

This update maintains full backward compatibility while providing a modern alternative WebDriver implementation through Playwright.
