---
'creevey': minor
---

Improve Storybook autostart

## Changes

### Enhanced CLI Options

- **`--startStorybook` / `-s`**: New flag to automatically start Storybook using detected package manager
- **`--storybookPort`**: Option to specify custom Storybook port (defaults to 6006)
- Improved argument parsing with proper URL handling

### Automatic Package Manager Detection

- **Added `package-manager-detector`**: Automatically detects and uses the appropriate package manager (npm, yarn, pnpm)
- Constructs proper `storybook dev` commands with correct flags (`--ci`, `--exact-port`)

### Enhanced Connection Logic

- **`src/server/connection.ts`**: Completely rewritten connection handling
  - `getStorybookUrl` now returns both local and remote URLs
  - Better distinction between localhost and network-accessible URLs
  - Improved executive command handling with `shelljs`

### Improved User Experience

- **Better logging**: Shows both local and network URLs when starting Storybook
- **Helpful tips**: Guides users to use `-s` flag for automatic Storybook starting
- **Clearer status messages**: Improved feedback during Storybook connection process

### Configuration Enhancements

- **`resolveStorybookUrl` support**: Config can now define dynamic URL resolution
- **Better port handling**: Automatic URL manipulation based on provided ports
- **Improved config merging**: Better handling of CLI options with config values

### Core Improvements

- **`src/server/index.ts`**: Enhanced primary process logic for Storybook management
- **Async execution**: Proper async handling for Storybook startup commands
- **Error handling**: Better error messages when package manager detection fails

This update significantly simplifies the Creevey setup process by automating Storybook startup and providing clearer guidance to users, making the testing workflow much more streamlined.
