---
'creevey': patch
---

Fix propagating error from selenium

## Changes

### Enhanced Error Propagation

- **Fixed browser error handling**: Selenium now properly propagates errors from browser context to Node.js
- **`src/server/selenium/internal.ts`**: Completely rewritten `loadStoriesFromBrowser` method
  - Uses tuple response pattern `[error, stories]` for better error handling
  - Catches errors in browser context and serializes them for transport
  - Reconstructs proper Error objects with stack traces in Node.js context
  - Prevents silent failures when story loading fails

### Implementation Details

- **Error handling pattern**:

  ```javascript
  // Before: Silent failures or unclear errors
  const stories = await this.#browser.executeAsyncScript((callback) => {
    window.__CREEVEY_GET_STORIES__().then(callback);
  });

  // After: Explicit error propagation
  const [error, stories] = await this.#browser.executeAsyncScript((callback) => {
    window
      .__CREEVEY_GET_STORIES__()
      .then((stories) => callback([null, stories]))
      .catch((error) => callback([{ message: error.message, stack: error.stack }]));
  });
  ```

### Other Improvements

- **`src/server/config.ts`**: Updated default Selenoid image from `aerokube/selenoid:latest-release` to `aerokube/selenoid:latest`
- **`src/server/selenium/selenoid.ts`**: Added proper container cleanup on shutdown

### Benefits

- **Better debugging**: Errors in browser context are now visible in Node.js with full stack traces
- **Reliable error handling**: No more silent failures when stories fail to load
- **Proper cleanup**: Container removal on shutdown prevents resource leaks

This fix ensures that errors occurring during story loading in the browser are properly captured and reported, making debugging much easier.
