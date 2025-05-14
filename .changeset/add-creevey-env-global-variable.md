---
'creevey': patch
---

Add **CREEVEY_ENV** global variable

## Changes

### Environment Detection

- **Added global boolean variable `__CREEVEY_ENV__`** to distinguish between different runtime contexts:
  - `false` in Storybook addon/development context
  - `true` in actual Creevey test environment (Playwright/Selenium)

### Implementation Details

- **`src/client/addon/withCreevey.ts`**:

  - Added type declaration for `__CREEVEY_ENV__` to global Window interface
  - Set to `false` in Storybook addon context

- **`src/server/playwright/internal.ts`**: Set to `true` when initializing Playwright browser environment

- **`src/server/selenium/internal.ts`**: Set to `true` when initializing Selenium browser environment

This global variable enables code to conditionally behave differently based on whether it's running in the Storybook development environment versus the actual Creevey testing environment.
