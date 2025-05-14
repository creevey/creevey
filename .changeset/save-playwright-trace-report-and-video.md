---
'creevey': minor
---

Save playwright trace report and video

## Changes

### Trace and Video Recording

- **Enhanced debugging capabilities**: Playwright now records traces and videos when debug mode is enabled
- **Trace files**: Saved as `trace.zip` in traces directory
- **Video files**: Saved as `video.webm` with proper viewport configuration
- **Traces directory**: Organized per process ID for isolation

### Docker Infrastructure Improvements

- **Better image management**: Images are now labeled with version for better cleanup
- **Smart image rebuilding**: Only rebuilds when version changes, preserving existing images
- **Container cleanup**: Removes old containers before building new images
- **Graceful shutdown**: Waits for browser close before removing Docker containers

### Enhanced Browser Context

- **Dedicated context creation**: Each browser gets its own context with recording configuration
- **Video recording**: Automatically enabled in debug mode with viewport size preservation
- **Screen configuration**: Proper screen and viewport setup in context creation
- **Improved resource management**: Better cleanup of contexts, pages, and browsers

### Code Organization

- **`src/server/playwright/index-source.mjs`**: New modular browser server configuration
  - Supports chromium, firefox, webkit
  - Configurable launch options through JSON
  - Dedicated traces directory setup
- **Docker file generation**: Now reads from source file for better maintainability

### Cache Management

- **Centralized cache usage**: All traces and videos stored in cache directory
- **Process isolation**: Each process gets its own subdirectory
- **Configurable traces directory**: Can be overridden via `playwrightOptions.tracesDir`

### Technical Improvements

- **ESLint config**: Added support for new `.mjs` source file
- **Better error handling**: Enhanced browser close handling with proper async/await
- **Removed viewport duplication**: Viewport is now handled in context creation instead of init

This update significantly enhances Creevey's debugging capabilities by automatically capturing traces and videos when running in debug mode, making it much easier to diagnose test failures and understand browser behavior during test execution.
