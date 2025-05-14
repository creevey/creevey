---
'creevey': minor
---

Add Creevey JUnit reporter

## Changes

### New JUnit Reporter

- **Native JUnit XML support**: Added `JUnitReporter` class for generating JUnit-compatible XML reports
- **Based on Vitest implementation**: Comprehensive JUnit XML generation with proper formatting
- **Configurable output**: Supports custom output file via `reporterOptions.outputFile`
- **Test statistics**: Tracks total tests, failures, and execution times

### Reporter System Refactoring

- **Modular reporters**: Split reporters into separate files:
  - `src/server/reporters/creevey.ts` - CreeveyReporter
  - `src/server/reporters/teamcity.ts` - TeamcityReporter
  - `src/server/reporters/junit.ts` - JUnitReporter (new)
  - `src/server/reporters/index.ts` - Reporter registry
- **String-based reporter selection**: Support for `'creevey'`, `'teamcity'`, `'junit'` string names
- **Enhanced reporter options**: Reporters now receive `{ reportDir, reporterOptions }` with direct access to report directory

### Enhanced Test Metadata

- **Worker tracking**: Added `workerId` to test metadata
- **Error handling**: Added `err` field to `FakeTest` interface
- **Session tracking**: Added `sessionId` to `TestResult` interface
- **Better browser identification**: Improved `browserName` resolution from test results

### JUnit Features

- **XML generation**: Proper JUnit XML format with escaped content
- **Suite organization**: Groups tests by suite (parent.title)
- **Statistics tracking**: Comprehensive test statistics including duration and failure counts
- **File management**: Automatic directory creation and file handling
- **Error reporting**: Test failures properly recorded in XML format

### CI/CD Integration

- **Industry standard**: JUnit XML is widely supported by CI systems
- **Detailed reporting**: Rich test metadata for better debugging
- **Artifact generation**: XML reports can be archived and analyzed by CI tools

This addition significantly enhances Creevey's CI/CD integration capabilities by providing native JUnit XML reporting alongside the existing Creevey and TeamCity reporters.
