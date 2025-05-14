---
'creevey': patch
---

Publish 0.10.0-beta.40

## Changes

### Enhanced Reporter Statistics

- **FakeRunner with stats**: Added statistics tracking to the fake runner
  - Tracks test duration, failures, and pending tests
  - Provides better compatibility with reporter libraries expecting stats

### Session ID Management

- **Session ID tracking**: Added session ID to test results
  - `TestResult` interface now includes optional `sessionId` field
  - Session ID is passed from worker to master runner
  - Used in test metadata for better traceability

### Improved JUnit Reporter Support

- **Better stats handling**: JUnit reporter now receives proper test statistics
  - Tracks failures count for each failed test
  - Accumulates total duration for successful tests
  - Enhances compatibility with `mocha-junit-reporter`

### Technical Improvements

- **Type safety**: Changed fakeRunner from generic EventEmitter to typed FakeRunner class
- **Better test metadata**: Session ID properly propagated through test execution pipeline

This release focuses on improving reporter compatibility and test metadata tracking for better integration with various test reporting tools.
