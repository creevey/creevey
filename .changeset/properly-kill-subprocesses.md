---
'creevey': patch
---

Properly kill subprocesses

## Changes

### Enhanced Process Management

- **Added `tree-kill` dependency**: Ensures proper termination of process trees including all child processes
- **Improved shutdown handling**: All subprocess termination now uses `tree-kill` for complete cleanup

### Specific Improvements

**Storybook Process Management**:

- **`src/server/index.ts`**: When starting Storybook with `-s` flag, now properly tracks and kills the process on shutdown
- Prevents orphaned Storybook processes when Creevey exits

**Selenoid Process Management**:

- **`src/server/selenium/selenoid.ts`**: Enhanced selenoid standalone process termination
- Replaced basic `kill()` with `tree-kill` to ensure complete process cleanup
- Fixed shelljs imports for better modularity

**Worker Process Management**:

- **`src/server/utils.ts`**: Updated `shutdownWorkers` and `gracefullyKill` functions
- Now uses `tree-kill` for worker termination to prevent zombie processes
- Ensures complete cleanup of worker processes and their children

### Benefits

- Prevents orphaned processes after Creevey shutdown
- More reliable resource cleanup in containerized environments
- Better handling of process hierarchies spawned by Storybook and Selenoid
- Eliminates potential port conflicts from lingering processes

This change significantly improves Creevey's robustness when starting and stopping, ensuring clean shutdowns without leaving background processes running.
