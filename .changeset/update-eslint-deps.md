---
'creevey': patch
---

Update ESLint dependencies and improve TypeScript types

## Dependencies Updated

### Production Dependencies

- Added `@storybook/types@^7.6.20` for better type definitions
- Updated `tsx` from `^4.17.0` to `^4.19.2`

### Development Dependencies

- Updated `@eslint/js` from `^9.9.1` to `^9.14.0`
- Updated `eslint` from `^9.9.1` to `^9.14.0`
- Updated `eslint-plugin-react` from `^7.35.0` to `^7.37.2`
- Updated `typescript-eslint` from `^8.3.0` to `^8.12.2`

## Code Improvements

### ESLint Configuration

- Removed unnecessary `@ts-expect-error` comment for `eslint-plugin-react` import
- Removed unnecessary `eslint-disable-next-line` comment in config

### Storybook Integration

- Updated addon manager to use `Addon_TypesEnum` from `@storybook/types` instead of `types` from `@storybook/manager-api`
- Replaced `AnyFramework` with `Renderer` type for better type safety in Storybook integration

### Type Improvements

- Changed object type definition to use `Record<ImagesViewMode, FunctionComponent<ViewProps>>` for better type safety
- Simplified Docker callback error type from `Error | null | undefined` to `Error | null`
- Improved error serialization type checking in worker using `typeof error === 'object'` instead of `error instanceof Object`

These updates improve type safety, remove unnecessary ESLint suppressions, and bring dependencies up to date with latest versions.
