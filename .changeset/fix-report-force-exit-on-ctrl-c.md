---
'creevey': patch
---

Fix report, force exit on Ctrl-C

## Changes

### Process Management

- **`src/creevey.ts`**: Added force exit mechanism for SIGINT handler
  - If already shutting down when receiving Ctrl-C, immediately force exit with `process.exit(-1)`
  - Prevents hang-ups during shutdown process

### Test Reporting

- **`src/server/reporter.ts`**: Improved test duration reporting
  - Removed duration from `TEST_BEGIN` event (tests haven't completed yet)
  - Added duration display to `TEST_FAIL` event for consistency with `TEST_PASS`

### Error Handling

- **`src/server/selenium/internal.ts`**: Simplified error reporting
  - Removed current URL retrieval from storybook loading errors (redundant information)
  - Removed unnecessary try-catch wrapper around storybook initialization check
  - Cleaner error messages for storybook loading failures

These changes improve user experience by providing more accurate test reporting and ensuring cleaner process termination.
