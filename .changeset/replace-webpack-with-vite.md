---
'creevey': patch
---

# Replace Webpack with Vite

This is a major change that migrates the build system from Webpack to Vite, improving build performance and development experience.

## Breaking Changes

- Build tool changed from Webpack to Vite
- Module system updated to ES modules
- Build scripts and configuration files completely replaced

## Changes

### Build Configuration

- **Removed**: `webpack.config.mjs`
- **Added**: `vite.config.mts` with React SWC plugin
- **Updated**: `tsconfig.json` to include Vite config instead of Webpack

### Package Scripts

- `start`: Now runs `vite --mode development` instead of Webpack dev server
- `build:client`: Uses `vite build` instead of Webpack build
- `lint`: Updated to use `concurrently` for parallel linting tasks

### Dependencies

- **Removed**: `babel-loader`, `redrun`, and Webpack-related packages
- **Added**: `@vitejs/plugin-react-swc`, `concurrently`
- **Cleaned up**: Multiple Babel dependencies no longer needed with Vite

### Code Changes

- **Client entry**: `src/client/web/index.html` now loads `index.tsx` as ES module
- **Server**: Removed Webpack message handlers and types from `src/server/messages.ts`
- **Types**: Removed `WebpackMessage` type definitions from `src/types.ts`
- **Comments**: Updated references from Webpack to reflect new Vite setup

### TODO Updates

- Marked "Replace mocha to manual runner" as completed
- Added new task: "Move some deps used in components to devDeps"

This migration should result in faster build times, better HMR (Hot Module Replacement), and improved development experience while maintaining the same functionality.
