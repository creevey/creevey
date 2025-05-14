---
'creevey': patch
---

Trigger restart on failed keep-alive, fix teamcity reporter

## Changes

### TeamCity Reporter Fix

- **`src/server/reporter.ts`**: Fixed test name reporting in both CreeveyReporter and TeamcityReporter
  - Changed from `test.titlePath().join('/')` to `test.fullTitle()` for consistent test naming
  - Ensures proper test identification in TeamCity builds and logs

### Browser Keep-Alive Improvements

- **`src/server/selenium/internal.ts`**: Enhanced error handling for browser keep-alive mechanism
  - Added error catching for failed `getCurrentUrl()` calls during keep-alive pings
  - Emits worker error message when keep-alive fails, triggering browser restart logic
  - Prevents hung sessions when browser becomes unresponsive

These changes improve reliability by properly handling browser session failures and ensuring consistent test reporting across different output formats.
