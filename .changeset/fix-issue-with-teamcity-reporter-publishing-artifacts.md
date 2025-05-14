---
'creevey': patch
---

Fix issue with teamcity reporter publishing artifacts

## Changes

### TeamCity Reporter Improvements

- **`src/server/reporter.ts`**: Fixed artifact publishing issues
  - Added proper `testFinished` event logging for passed tests
  - Fixed file path construction by removing test name from artifact path using `.slice(0, -1)`
  - Ensures correct artifact structure for TeamCity integration

This resolves issues with TeamCity not properly recognizing test completion and incorrectly structured artifact paths.
