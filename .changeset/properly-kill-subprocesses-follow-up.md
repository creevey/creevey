---
'creevey': patch
---

Properly kill subprocesses (follow-up)

## Changes

### Dependency Change

- **Replaced `tree-kill` with `pidtree`**: Switched to a more reliable process tree discovery mechanism
- **Custom `killTree` implementation**: Added custom function for killing process trees

### Implementation Details

- **`src/server/utils.ts`**: Added `killTree` function that:
  - Uses `pidtree` to discover all child processes
  - Kills all child processes and the root process with `SIGKILL`
  - Handles promise-based PID tree discovery

### Updated Usage

- **All subprocess termination**: Updated calls in:
  - Storybook process management (`src/server/index.ts`)
  - Selenoid process management (`src/server/selenium/selenoid.ts`)
  - Worker process termination (`src/server/utils.ts`)

### Benefits

- More reliable process tree discovery than `tree-kill`
- Better handling of edge cases in process termination
- Explicit SIGKILL ensures processes are forcefully terminated
- Cleaner async/await pattern for process cleanup

This refinement provides more robust subprocess termination by using `pidtree` for accurate process tree discovery before termination.
