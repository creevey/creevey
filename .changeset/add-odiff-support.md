---
'creevey': minor
---

Add odiff support for image comparison

This change implements alternative image comparison using the odiff library:

**New Features:**

- Added `odiff-bin` dependency for high-performance image comparison
- Implemented new `getOdiffMatchers` function with the same API as the existing image matchers
- Added `odiffOptions` to default configuration with sensible defaults that match existing settings
- Added command-line flag `--odiff` to enable odiff-based comparison instead of pixelmatch

**Configuration Changes:**

- Added default configuration for odiff with `threshold: 0` and `antialiasing: true`
- Removed unused `saveReport` flag (reporting is now always enabled)
- Made `tests` flag no longer required for skipping webdriver setup

**Code Refactoring:**

- Extracted image path and context handling into separate functions
- Moved file system utilities from worker.ts to match-image.ts
- Created a shared ImageContext interface for better type safety
- Simplified error handling in image comparison functions

This enhancement provides a more advanced image comparison alternative that can be enabled with the `--odiff` flag while maintaining backward compatibility with the existing pixelmatch implementation.
