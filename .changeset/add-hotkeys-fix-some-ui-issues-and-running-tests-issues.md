---
'creevey': patch
---

Add hotkeys, fix some UI issues and running tests issues

## Changes

### New Hotkeys

- **Alt + Space**: Toggle between expected/actual images in SwapView
- **Tab/Shift+Tab**: Cycle through view modes (Side by Side, Swap, Blend) when reviewing test results
- **Alt key**: Dynamically changes "Approve" button to "Next" button in sidebar footer

### UI/UX Improvements

- **Consolidated context**: Moved sidebar focus functionality from KeyboardEventsContext to CreeveyContext for better organization
- **Enhanced navigation**: Next test navigation now handles failed images within a test before moving to the next test
- **Performance**: Added equality check for globals updates to prevent unnecessary re-renders
- **State management**: Improved memoization and state handling in CreeveyApp

### Bug Fixes

- **Import optimization**: Replaced lodash imports with specific functions (noop from types, isEqual from lodash/isEqual)
- **Focus management**: Better keyboard navigation and focus handling in sidebar
- **Result handling**: Fixed result memoization and image state management

### Code Quality

- Added TODO comment for image name as title feature
- Improved component prop handling and event management
- Better error state handling for empty results

These changes significantly improve the user experience with keyboard shortcuts and more intuitive navigation through test results.
