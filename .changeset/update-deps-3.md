---
'creevey': patch
---

Update deps

## Changes

### Major Dependency Updates

- **Storybook packages**: Updated from `8.5.8` to `8.6.12`
  - Includes all `@storybook/*` packages and addons
  - Updated peer dependencies to match new version requirements
- **TypeScript**: Updated from `^5.7.3` to `^5.8.2`
- **ESLint**: Updated from `^9.20.1` to `^9.23.0`
- **TypeScript ESLint**: Updated from `8.24.1` to `8.29.0`

### Other Dependency Updates

- `@storybook/icons`: `^1.3.2` → `^1.4.0`
- `@types/dockerode`: `^3.3.34` → `^3.3.37`
- `@types/lodash`: `^4.17.15` → `^4.17.16`
- `dockerode`: `^4.0.4` → `^4.0.5`
- `koa`: `^2.15.4` → `^2.16.0`
- `vite`: `^5.4.14` → `^5.4.17`

### Type Import Updates

- **Storybook types**: Changed imports from `@storybook/csf` to `@storybook/types`
  - Affected files: `.storybook/preview.tsx`, various server and client files
  - Updated imports for `Args`, `Parameters`, `DecoratorFunction`, `StoryContextForEnhancers`

### Code Improvements

- **Nullish coalescing assignment**: Simplified object initialization using `??=` operator
  - `test.results ??= []` instead of conditional checks
  - `test.approved ??= {}` instead of conditional checks
  - Applied in runner, parser, and selenoid configuration files
- **Cleanup**: Removed deprecated ESLint disable comments
- **Formatting**: Improved Docker file generation formatting

This update ensures compatibility with the latest versions of core dependencies while maintaining functionality and improving code quality through modern JavaScript patterns.
