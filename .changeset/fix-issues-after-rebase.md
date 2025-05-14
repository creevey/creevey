---
'creevey': patch
---

Fix issues after rebase

## Changes

### Logger Refactoring

- **Unified logger usage**: Converted all direct `logger` calls to `logger()` function calls across multiple files for consistency
- **Removed individual logger instances**: Eliminated per-session logger instances in favor of centralized logging

### Playwright Internal Changes

- **`src/server/playwright/internal.ts`**:
  - Removed direct Logger import and instance management
  - Replaced all `this.#logger` calls with centralized `logger()` function
  - Updated log prefix format to include process PID and session ID for better traceability

### Reporter Updates

- **`src/server/reporter.ts`**: Changed logger identification from browserName to sessionId for more accurate tracking

### Configuration and Core Files

- **`src/creevey.ts`**: Fixed deprecated reporter warning to use function call
- **`src/server/config.ts`**: Updated webdriver warning to use function call
- **`src/server/docker.ts`**: Standardized image logging to use function call

### Type Definitions

- **`src/types.ts`**: Removed unused Logger import

### URL Resolution

- **`src/server/playwright/internal.ts`**: Removed logger parameter from `resolveStorybookUrl` call since logging is now centralized

This refactoring improves consistency in logging across the codebase and eliminates redundant logger instance management while maintaining all logging functionality.
