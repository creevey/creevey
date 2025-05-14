---
'creevey': patch
---

Fix docker containers removal on worker's shutdown

## Changes

### Docker Container Management

- **`src/server/docker.ts`**: Improved Docker container cleanup logic
  - Added force removal of existing containers when building images with same name
  - Simplified container lifecycle management to only remove containers on shutdown
  - Uses `force: true` flag for reliable container removal even if containers are running

### Browser Configuration

- **`.creevey/browsers/chrome.mts`, `.creevey/browsers/firefox.mts`**: Added `limit: 2` property to control maximum concurrent browser instances per type

### Dependency Updates

- Updated multiple Storybook packages from `8.4.5` to `8.4.7`
- Updated ESLint packages including `@eslint/core` and `@eslint/js`
- Updated TypeScript ESLint packages from `8.15.0` to `8.19.1`
- Various other dependency bumps including `@octokit/core`, `dockerode`, and `@storybook/icons`

### Test Image Updates

- Updated multiple test reference images (PNG files) with new Git LFS metadata
- Images updated across BlendView, SideBar, SideBySideView, SlideView, and SwapView components

These changes ensure proper cleanup of Docker containers during worker shutdown, preventing container accumulation and resource leaks in containerized testing environments.
