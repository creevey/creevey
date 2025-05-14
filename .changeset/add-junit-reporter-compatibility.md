---
'creevey': patch
---

Add JUnit reporter compatibility

## Changes

### JUnit Reporter Support

- **Enhanced JUnit compatibility**: Added support for `mocha-junit-reporter`
- **Suite lifecycle events**: Emit `SUITE_BEGIN` and `SUITE_END` events when JUnit reporter is detected
- **Automatic detection**: Detects JUnit reporter by class name and adjusts event emission accordingly

### Implementation Details

- **`src/server/master/runner.ts`**: Added JUnit reporter detection logic
  - Checks if reporter name is `MochaJUnitReporter`
  - Conditionally emits suite events around test execution
  - Workaround to fix parallel test execution issues with JUnit reporter
- **`src/types.ts`**: Added new suite events to `TEST_EVENTS` enum
  - `SUITE_BEGIN = 'suite'`
  - `SUITE_END = 'suite end'`

### Benefits

- **Better CI integration**: Improved compatibility with JUnit report formats
- **Parallel test support**: Fixes issues with parallel test execution when using JUnit reporters
- **Selective behavior**: Suite events only emitted for JUnit reporter, no impact on other reporters
- **Standard compliance**: Follows Mocha's expected event lifecycle for better reporter compatibility

This enhancement ensures proper JUnit report generation and resolves parallel execution issues specifically with mocha-junit-reporter.
