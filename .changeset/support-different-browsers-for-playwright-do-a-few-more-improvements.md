---
'creevey': patch
---

Support different browsers for playwright, do a few more improvements

## Changes

### Playwright Browser Support

- **Enhanced browser support**: Added comprehensive browser mapping for Playwright
  - Supports chromium, chrome, chrome-beta, msedge, msedge-beta, msedge-dev, bidi-chromium, firefox, webkit
  - Maps browser names to appropriate Playwright browser types for Docker containers

### Docker Build Improvements

- **`src/server/docker.ts`**: Enhanced Docker image building process
  - Added intelligent spinner behavior that shows/hides based on log level
  - Improved progress tracking with stream output parsing
  - Better error handling with proper error message display
  - Added support for Docker buildkit version selection (version: '1')
  - Fixed duplicate error handling for failed builds

### Playwright Docker Configuration

- **`src/server/playwright/docker-file.ts`**: Improved Docker file generation
  - Updated to use `node:lts` base image instead of pre-built Playwright image
  - Added dynamic browser installation with proper dependencies
  - Support for custom launch options passed to browser server
  - Better version handling for Playwright packages

### Server Optimizations

- **`src/server/index.ts`**: Streamlined Playwright container management
  - Improved browser configuration handling for Docker containers
  - Better deduplication of browser types for container building

### Test Image Updates

- Updated reference images across multiple components (BlendView, PageFooter, PageHeader, ResultsPage, SideBar, SideBarHeader)
- All images updated with new Git LFS metadata reflecting visual changes

These changes provide more flexible browser support for Playwright testing while improving the overall Docker build experience and error handling.
