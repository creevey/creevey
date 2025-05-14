---
'creevey': minor
---

Storybook autostart are able to get free available port if default is used

## Changes

### Automatic Port Detection

- **Smart port allocation**: When using `-s` flag, Creevey automatically finds an available port if the default port (6006) is in use
- **Uses `get-port` library**: Ensures no port conflicts when starting Storybook
- **Applies only in primary cluster**: Port detection logic only runs once per test session

### Enhanced CLI Interface

- **`-s` / `storybookStart`**: Can now accept either boolean (`true`) or string (custom command)
  - `creevey -s` - Uses detected package manager with auto port detection
  - `creevey -s="custom command"` - Uses custom command with auto port detection
- **Removed default `storybookPort`**: No longer required in CLI arguments

### Simplified Connection Logic

- **Streamlined URL handling**: Removed complex `resolveStorybookUrl` callback pattern
- **Direct resolution**: Always attempts direct URL resolution for localhost addresses
- **Cleaner worker communication**: Each worker receives its specific Storybook URL

### Worker Isolation Improvements

- **Per-browser Storybook URLs**: Workers can now use different Storybook URLs per browser configuration
- **Enhanced worker queue**: Passes Storybook URL to each worker instance
- **Better worker pool management**: Handles Storybook URL per worker lifecycle

### Code Simplification

- **Removed `tryAutorunStorybook`**: Eliminated redundant auto-start logic
- **Simplified browser internals**: Removed `resolveStorybookUrl` parameter from Playwright and Selenium implementations
- **Cleaner type definitions**: Made `storybookPort` optional, enhanced `storybookStart` type

This update makes Creevey much more robust when working in environments where the default Storybook port might be in use, automatically finding and using an available port while maintaining the same user-friendly interface.
