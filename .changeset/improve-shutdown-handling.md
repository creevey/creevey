---
'creevey': patch
---

Improve shutdown handling

## Changes

### Centralized Container Management

- **`src/server/worker/context.ts`**: New module for managing worker container lifecycle
  - `setWorkerContainer()`: Stores container reference for later cleanup
  - `removeWorkerContainer()`: Handles safe container removal with force flag
  - Centralizes container state management across the worker

### Enhanced Shutdown Process

- **Simplified Docker shutdown**: Removed complex race condition handling in `src/server/docker.ts`
  - Container cleanup is now deferred to worker shutdown
  - No longer tries to wait for browser close before container removal

### Webdriver Shutdown Coordination

- **Both Playwright and Selenium webdrivers**: Updated shutdown handlers to:
  1. Close browser gracefully
  2. Remove Docker container after browser close
  3. Exit process cleanly
- **Consistent shutdown flow**: Both webdriver implementations now follow the same pattern

### Timing Adjustments

- **Master shutdown timeout**: Reduced back to 500ms for faster shutdown
- **Removed artificial delays**: No longer enforces 5-second delay for Playwright shutdown

### Benefits

- **More predictable shutdown**: Container cleanup happens after browser close
- **Cleaner resource management**: Centralized container lifecycle prevents resource leaks
- **Faster shutdown**: Reduced timeouts and eliminated unnecessary waits
- **Better error handling**: Container removal failures are isolated and don't affect other shutdown steps

This refactoring makes the shutdown process more robust and predictable by centralizing container management and ensuring proper cleanup order.
