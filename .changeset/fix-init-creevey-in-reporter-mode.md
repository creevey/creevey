---
'creevey': patch
---

Fix init creevey in reporter mode

## Changes

### WebSocket Error Handling

- **`src/client/shared/creeveyClientApi.ts`**: Fixed promise rejection handling for WebSocket initialization
  - Added `clientApiRejecter` to properly handle WebSocket connection errors
  - Added error event listener that rejects the initialization promise on WebSocket errors
  - Prevents hanging when WebSocket connection fails in reporter mode

### Improved Error Handling

- Promise in `initCreeveyClientApi` now properly handles both resolve and reject cases
- WebSocket errors no longer cause the initialization to hang indefinitely
- Allows proper error handling when Creevey fails to connect to the server in report mode

This fix ensures that when Creevey is running in reporter mode and encounters WebSocket connection issues, the initialization properly fails with an error rather than hanging indefinitely.
