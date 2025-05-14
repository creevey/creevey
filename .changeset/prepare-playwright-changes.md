---
'creevey': minor
---

Prepare code architecture for Playwright integration

This change refactors the codebase to support multiple browser implementations by:

- Renaming `BrowserConfig` to `BrowserConfigObject` throughout the codebase to better reflect its specific role
- Converting callback-based client APIs to Promise-based APIs for better async handling:
  - `__CREEVEY_SELECT_STORY__` now returns a Promise instead of taking a callback
  - `__CREEVEY_HAS_PLAY_COMPLETED_YET__` now returns a Promise instead of taking a callback
- Introducing `CreeveyBrowser` interface to abstract browser operations
- Consolidating browser-specific functionality into a unified `seleniumBrowser` object
- Simplifying function signatures by removing unused options parameters from `master()` and `storiesProvider()`

These changes create a cleaner architecture that will enable seamless Playwright integration while maintaining backward compatibility with existing Selenium-based functionality.
