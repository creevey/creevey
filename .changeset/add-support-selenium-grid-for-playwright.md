---
'creevey': patch
---

Add support for Selenium Grid in Playwright browser automation

This change enables Playwright to connect to Selenium Grid servers, expanding deployment options beyond standalone browser instances.

**Key Changes:**

- **Selenium Grid Support**: Added protocol detection to connect Playwright to Selenium Grid when using HTTP/HTTPS URLs (vs WebSocket for standalone Playwright servers)
- **Environment Variables**: Added `SELENIUM_REMOTE_URL` and `SELENIUM_REMOTE_CAPABILITIES` for Grid configuration
- **Browser Restriction**: Limited Selenium Grid support to Chrome browser only (Playwright limitation)
- **Dependency Management**:
  - Moved `@storybook/icons` to production dependencies
  - Removed unused Storybook packages: `@storybook/client-logger`, `@storybook/core-common`, `@storybook/core-events`, `@storybook/core-server`
- **Code Refactoring**:
  - Replaced hardcoded Storybook event strings with `StorybookEvents` enum for better type safety
  - Added runtime dependency checks for `selenium-webdriver` and `playwright-core`
- **Documentation**: Added TODO item to replace `@storybook/core-events` usage

**Breaking Changes:** None

**Migration Notes:**

- If using Selenium Grid with Playwright, ensure you're using Chrome as the browser
- Set appropriate environment variables or grid URL configuration for remote execution
