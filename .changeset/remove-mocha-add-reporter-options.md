---
'creevey': major
---

# Remove Mocha, Add Reporter Options

This release removes the Mocha testing framework and introduces enhanced reporter options with custom implementations.

## Breaking Changes

### Mocha Removal

- Completely removed Mocha testing framework and all related dependencies
- Removed `@types/mocha` and `mocha` from package.json
- Deleted Mocha-specific type definitions and helper functions

### Test Context Changes

- Replaced Mocha's `Context` with custom `CreeveyTestContext`
- Updated test functions to use `context` parameter instead of `this`
- Changed method signatures: `this.expect().to.matchImage()` → `context.matchImage()`

### Image Matching Updates

- Moved image comparison logic to dedicated `match-image.ts` module
- Added deprecation warnings for `matchImage` and `matchImages` methods
- Introduced new context-based image matching: `context.matchImage()` and `context.matchImages()`

## New Features

### Enhanced Reporter System

- Added `BaseReporter` type for custom reporter configuration
- Introduced `CreeveyReporter` and `TeamcityReporter` implementations
- Added conditional reporter selection based on `TEAMCITY_VERSION` environment variable
- Moved reporter configuration from command-line to config file

### Improved Error Handling

- Enhanced error message structure with `subtype: 'unknown'` field
- Improved worker process error management
- Added graceful worker termination logic

### Configuration Updates

- Added `testTimeout` property (default: 30,000ms)
- Removed `--reporter` CLI option in favor of config-based setup
- Updated default configuration to include reporter options

## Migration Guide

### Test Updates

Replace Mocha context usage:

```javascript
// Before
this.expect(await this.takeScreenshot()).to.matchImage('example');

// After
context.matchImage(await context.takeScreenshot(), 'example');
```

### Reporter Configuration

Move reporter configuration to config file:

```javascript
// In creevey.config.js
export default {
  reporter: 'creevey', // or 'teamcity'
  reporterOptions: {
    // custom options
  },
};
```

## Technical Details

- Refactored test loading mechanism with `getTestsFromStories()`
- Introduced `FakeRunner` class for custom test execution
- Updated browser switching logic to use context parameters
- Enhanced screenshot handling and comparison functionality
- Improved platform detection and command adaptation
