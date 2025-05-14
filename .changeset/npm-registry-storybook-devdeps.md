---
'creevey': patch
---

**Docker Registry Support & Dependency Optimization**

- **Docker Registry Detection**: Added automatic npm registry detection for Docker containers. The system now executes `npm config get registry` and conditionally adds registry configuration to the Docker build process if a custom registry is detected.

- **Dependency Reorganization**: Moved Storybook-related dependencies from `dependencies` to `devDependencies` to optimize production builds:

  - `@storybook/components`
  - `@storybook/core-events`
  - `@storybook/csf`
  - `@storybook/icons`
  - `@storybook/manager-api`
  - `@storybook/preview-api`
  - `@storybook/theming`
  - `@storybook/types`

- **Package.json Cleanup**: Simplified the `bin` field from object notation to direct string notation for cleaner configuration.

These changes improve Docker build reliability in environments with custom npm registries while reducing the production bundle size by properly categorizing development-only dependencies.
