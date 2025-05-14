---
'creevey': patch
---

Update React to 18.x

## Breaking Changes

### React 18 Migration

- Updated React from `17.0.2` to `18.3.1`
- Updated React DOM from `17.0.2` to `18.3.1`
- Updated React types from `17.x` to `18.x`
- Migrated from deprecated `ReactDOM.render` to new `createRoot` API

### Component Type Updates

- Replaced `React.ReactChild` with `PropsWithChildren<T>` for better type safety
- Added explicit type casting for React elements where required by type checker

## Other Changes

### Dependencies

- Updated `@types/react` from `^17.0.83` to `^18.3.12`
- Updated `@types/react-dom` from `^17.0.25` to `^18.3.1`
- Updated `react-is` from `^17.0.2` to `^18.3.1`
- Added `koa` dependency `^2.15.3`
- Downgraded `@storybook/csf` from `^0.1.11` to `^0.1.2`

### TypeScript Updates

- Added `@ts-expect-error` comments for known Storybook type issues (fixed in storybookjs/storybook#26623)
- Updated function component types to use `PropsWithChildren` pattern

### Implementation Details

- Updated Storybook preview decorator to cast story return type as `React.ReactElement`
- Modified KeyboardEventsContext to use proper PropsWithChildren typing
- Updated web app initialization to use React 18's createRoot API
- Fixed component prop typing in stories
