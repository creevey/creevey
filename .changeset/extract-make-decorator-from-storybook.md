---
'creevey': patch
---

Extract makeDecorator from storybook

## Changes

### Reduced Storybook Dependency

- **Extracted `makeDecorator`**: Created internal implementation in `src/client/addon/makeDecorator.ts`
- **Removed dependency on Storybook internals**: No longer imports `makeDecorator` from `@storybook/preview-api`
- **Type-only imports**: Changed Storybook imports to type-only where possible

### Implementation Details

- **`src/client/addon/makeDecorator.ts`**: New file containing:
  - Modified version of Storybook's `makeDecorator` function
  - `MakeDecoratorOptions` interface
  - `MakeDecoratorResult` type
  - Complete decorator implementation with proper TypeScript support
- **`src/client/addon/withCreevey.ts`**: Updated imports to use local `makeDecorator`

### Benefits

- **Reduced coupling**: Less dependent on Storybook's internal APIs
- **Version resilience**: Changes to Storybook's `makeDecorator` won't break Creevey
- **Better control**: Can customize decorator behavior as needed
- **Stability**: Reduces risk of breaking changes from Storybook updates

This change makes Creevey more independent from Storybook's internal APIs while maintaining the same decorator functionality.
