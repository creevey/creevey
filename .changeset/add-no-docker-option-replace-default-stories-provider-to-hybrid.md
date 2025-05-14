---
'creevey': minor
---

Add noDocker option, replace default stories provider to hybrid

## Changes

### New Command Line Option

- **`--noDocker`**: Added boolean flag to disable Docker usage via command line
  - Overrides `useDocker: true` in configuration when specified
  - Provides convenient way to run tests without Docker from CLI

### Stories Provider Changes

- **Default stories provider**: Changed from `browserStoriesProvider` to `hybridStoriesProvider`
  - Provides more flexible story loading capabilities
  - Better performance for different testing scenarios

### Configuration Updates

- **`src/server/config.ts`**: Enhanced configuration handling
  - Added `testsDir` to default config with `src` as default directory
  - Improved config merge logic to respect CLI `noDocker` option
  - Updated default stories provider reference

### CLI Enhancements

- **`src/creevey.ts`**: Added `noDocker` to boolean options list
- **`src/types.ts`**: Added `noDocker` property to `Options` interface

This change provides users with more flexibility in how they run Creevey tests, allowing them to easily switch between Docker and standalone modes while benefiting from improved story loading capabilities.
