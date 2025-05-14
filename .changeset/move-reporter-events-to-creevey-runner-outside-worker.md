---
'creevey': minor
---

Move reporter events to creevey runner outside worker

## Changes

### Reporter Architecture Overhaul

- **Centralized reporting**: Moved reporter instantiation from worker processes to master runner
- **Single reporter instance**: One reporter handles all test events instead of per-worker reporters
- **Event coordination**: Master runner creates fake test objects and emits proper test events

### Key Architectural Changes

**Master Runner (`src/server/master/runner.ts`)**:

- Created single reporter instance that handles all browser test events
- Constructs `FakeTest` and `FakeSuite` objects with complete test metadata
- Emits proper test lifecycle events: `TEST_BEGIN`, `TEST_PASS`, `TEST_FAIL`, `TEST_END`
- Enhanced test result handling with retries tracking

**Worker Simplification (`src/server/worker/start.ts`)**:

- Removed reporter instantiation from workers
- Simplified test execution flow without event emission
- Workers now send complete test results to master
- Reduced worker process complexity

**Reporter Simplification (`src/server/reporter.ts`)**:

- Removed complex options handling from constructors
- Dynamic logger creation per test instead of per-worker
- Simplified reporter interfaces for both CreeveyReporter and TeamcityReporter

### Enhanced Test Metadata

- **`TestResult` interface**: Added `retries`, `duration`, and `attachments` fields
- **`FakeTest` interface**: Added `creevey` field with Creevey-specific metadata
- **Better test tracking**: Complete test information available in reporter events

### Improved Error Handling

- **Retries tracking**: Test results now include retry count information
- **Duration tracking**: Automatic test duration calculation and reporting
- **Attachment handling**: Test attachments properly passed to reporters

### Benefits

- **Consistent reporting**: All test events go through single reporter instance
- **Better coordination**: No race conditions between multiple reporter instances
- **Simplified workers**: Workers focus solely on test execution
- **Enhanced debugging**: Better test metadata and error information
- **Cleaner architecture**: Clear separation between test execution and reporting

This major refactoring improves the overall reliability and consistency of test reporting while simplifying the worker process architecture.
