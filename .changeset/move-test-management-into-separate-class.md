---
'creevey': patch
---

Move test management into separate class

## Changes

### Architecture Refactoring

- **Created TestsManager class**: Extracted test data management from Runner into a dedicated TestsManager class
- **Improved separation of concerns**: Runner now focuses on test execution orchestration while TestsManager handles test data operations

### TestsManager Implementation

- **`src/server/master/testsManager.ts`**: New class for centralized test data management
  - Handles test loading, merging, and saving operations
  - Manages test status updates and approvals
  - Provides methods for test data retrieval and manipulation

### Runner Class Refactoring

- **`src/server/master/runner.ts`**: Simplified Runner implementation
  - Removed internal test storage and management logic
  - Delegates all test operations to TestsManager instance
  - Cleaned up copyImage and test approval logic
  - Maintains same public API for backward compatibility

### Master Process Updates

- **`src/server/master/master.ts`**: Updated initialization process
  - Creates TestsManager instance before Runner
  - Passes TestsManager to Runner constructor
  - Simplified test loading and merging workflow

### Reporting Improvements

- **`src/server/master/start.ts`**: Updated report generation
  - Removed duplicate reportDataModule function
  - Uses TestsManager for saving test data
  - Cleaner integration with existing reporting system

### Benefits

- **Better maintainability**: Clear separation between test execution and data management
- **Easier testing**: TestsManager can be tested independently
- **Improved code organization**: Related functionality grouped in appropriate classes
- **Future extensibility**: TestsManager provides a foundation for additional test data features

This refactoring maintains full backward compatibility while significantly improving the internal architecture and making the codebase more maintainable.
