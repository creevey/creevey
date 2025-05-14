---
'creevey': minor
---

Migrate from Koa to Hyper-Express HTTP server

## Changes

### Framework Migration

- **Complete server framework replacement**: Migrated from Koa to Hyper-Express for improved performance and simplicity
- **Updated dependencies**: Removed Koa-related packages (`@koa/cors`, `koa`, `koa-bodyparser`, `koa-mount`, `koa-static`) and added `hyper-express`

### New Handler Architecture

- **`src/server/master/handlers/`**: Created dedicated handler modules for better organization:
  - `ping-handler.ts`: Simple health check endpoint
  - `stories-handler.ts`: Story update management with clustering support
  - `capture-handler.ts`: WebDriver capture request handling
  - `static-handler.ts`: Static file serving with error handling
  - `index.ts`: Centralized exports for all handlers

### Server Implementation Updates

- **`src/server/master/server.ts`**: Complete rewrite using HyperExpress
  - Replaced Koa middleware with HyperExpress equivalents
  - Updated CORS handling and request parsing
  - Simplified route definitions and WebSocket management
  - Added custom broadcast function for WebSocket connections

### API Integration Changes

- **`src/server/master/api.ts`**: Updated WebSocket handling for HyperExpress
  - Replaced `ws` library integration with HyperExpress WebSocket interface
  - Updated `broadcast` function to use HyperExpress's `publish` method
  - Modified message handling to work with new server framework

### Enhanced Shutdown Handling

- **`src/server/shutdown.ts`**: New dedicated shutdown module
  - Centralized handling of process signals (SIGINT, uncaught exceptions)
  - Proper cleanup for clustered environments
  - Moved shutdown logic from main entry points for better organization

### Test Management Updates

- **`src/server/master/master.ts`**: Updated test management flow
  - Changed `testsManager.loadAndMergeTests(tests)` to `testsManager.updateTests(testsManager.loadAndMergeTests(tests))`
  - Improved integration with new server architecture

### Storybook Integration

- **`src/server/storybook/withCreevey.ts`**: Simplified for HyperExpress compatibility
  - Removed unnecessary story counter state management
  - Streamlined story fetching logic

### Benefits

- **Better Performance**: HyperExpress offers superior performance compared to Koa
- **Simplified Architecture**: More straightforward request handling and middleware setup
- **Improved WebSocket Handling**: Native WebSocket support with better broadcasting capabilities
- **Better Error Handling**: Enhanced shutdown process and error management
- **Modular Design**: Cleaner separation of concerns with dedicated handler modules

### Backward Compatibility

- **External API unchanged**: All public APIs and endpoints remain the same
- **Configuration compatible**: Existing Creevey configurations continue to work
- **Feature parity**: All existing functionality preserved with improved performance

This migration provides a solid foundation for future enhancements while maintaining full compatibility with existing Creevey usage patterns.
