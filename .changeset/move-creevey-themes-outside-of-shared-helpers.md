---
'creevey': patch
---

Move Creevey themes outside of shared helpers

## Changes

### Code Organization Refactoring

- **`src/client/web/themes.ts`**: Created new dedicated file for theme management
  - Moved `useTheme` hook from shared helpers
  - Moved theme-related utilities (`isTheme`, `initialTheme`, `CREEVEY_THEME` constant)
  - Centralized all theme logic in one location

### Updated Imports

- **`src/client/shared/helpers.ts`**: Removed theme-related code and imports
- **`src/client/web/CreeveyApp.tsx`**: Updated import path for `useTheme` hook
- **`src/client/web/CreeveyLoader.tsx`**: Updated import path for `useTheme` hook

This refactoring improves code organization by separating theme functionality from general helper utilities, making the codebase more modular and easier to maintain.
