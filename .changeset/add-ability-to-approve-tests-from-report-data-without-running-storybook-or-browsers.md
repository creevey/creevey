---
'creevey': minor
---

Add ability to approve tests from report data without running storybook or browsers

## Changes

### Update Mode Refactoring

- **Enhanced CreeveyStatus interface**: Added `isUpdateMode` property to distinguish between regular test execution and update-only mode
- **Server-side updates**: Modified Runner class to include `isUpdateMode` in status responses
- **Client-side integration**: Updated CreeveyApp and CreeveyContext to handle update mode state

### Update Mode Implementation

- **`src/types.ts`**: Extended CreeveyStatus interface with optional `isUpdateMode` property
- **`src/client/shared/creeveyClientApi.ts`**:
  - Added update mode detection from server status
  - Prevented test start/stop operations in update mode with user warnings
- **`src/client/web/CreeveyApp.tsx`**: Added `isUpdateMode` to initial state and context provider
- **`src/client/web/CreeveyContext.tsx`**: Extended context interface to include `isUpdateMode`

### UI Enhancements

- **Update mode indicators**: UI now shows when in update mode for approving screenshots
- **Operation restrictions**: Test execution controls are disabled in update mode
- **Context-based state**: Components access update mode directly from React context

### Method Standardization

- **TestsManager API**: Standardized method names for consistency:
  - `approveTest` → `approve`
  - `approveAllTests` → `approveAll`

### Backward Compatibility

- **URL parameter fallback**: Maintains compatibility with existing update mode detection
- **Progressive enhancement**: Server-provided `isUpdateMode` takes precedence over URL parameters

### Benefits

- **Standalone approval workflow**: Approve test images without running Storybook or browsers
- **Improved UX**: Clear visual indicators for update mode status
- **Better architecture**: Centralized mode state management through React context
- **Enhanced safety**: Prevents accidental test execution during approval sessions

This feature enables teams to review and approve visual changes in a dedicated UI mode, streamlining the screenshot approval workflow without requiring active test execution.
