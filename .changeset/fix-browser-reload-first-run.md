---
'creevey': patch
---

Fix browser reload on very first run

This change addresses issues with browser initialization on the first run by:

- Adding retry logic to story loading from browser with 1-second delay
- Improving error handling in worker startup process
- Fixing worker message type checking in queue management
- Adjusting default diff threshold from 0 to 0.05 for better stability
- Disabling anti-aliasing in default diff options for more consistent results
- Ensuring test reports are always uploaded in CI, even on failure

The main fix prevents failures when the browser/storybook isn't fully ready on the very first run by implementing a retry mechanism with proper error handling.
