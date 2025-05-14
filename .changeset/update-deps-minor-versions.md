---
'creevey': minor
---

## Update dependencies to minor versions

This release updates various dependencies to their latest minor versions and includes several improvements to JSX handling and type safety.

### Dependency Updates

**Major dependency updates:**

- `@koa/cors`: `^3.3.0` → `^3.4.3`
- `@octokit/core`: `^4.0.4` → `^4.2.4`
- `@storybook/csf`: `^0.1.2` → `^0.1.11`
- Multiple `@types/*` packages updated to newer versions
- `chokidar`, `loglevel`, `micromatch`, `selenium-webdriver` and other libraries updated

### Code Changes

**JSX Import Enhancement:**

- Added `JSX` to React imports across all TSX files for improved type support
- This change affects all React components in the codebase, enhancing TypeScript compatibility

**Component Updates:**

- **Paging Component**: Changed `activePage` prop type from `number` to `string` for consistency
- **PageFooter**: Updated to pass `activePage` as string (`${retry}`) instead of number

**Code Quality Improvements:**

- Removed TypeScript error suppression comments related to Storybook issues that are no longer relevant
- Added ESLint disable comment for promise handling in server code
- Reorganized imports in `Search.tsx` for better code organization

### Impact

This release primarily focuses on dependency maintenance and type safety improvements. No breaking changes are introduced, and the updates should enhance overall stability and TypeScript support across the application.

The JSX import additions ensure forward compatibility with future React versions and provide better type checking for JSX elements.
