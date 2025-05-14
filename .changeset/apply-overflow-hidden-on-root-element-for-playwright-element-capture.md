---
'creevey': patch
---

Apply overflow: hidden on root element for playwright element capture

## Changes

### Playwright Screenshot Enhancement

- **`src/server/playwright/internal.ts`**: Applied `overflow: hidden !important` style to root element during element screenshots
  - Prevents unwanted scrollbars and content overflow in captured screenshots
  - Ensures consistent visual appearance across different element sizes and content

### UI Improvements

- **`src/client/web/CreeveyView/SideBar/SideBar.tsx`**: Added bottom margin to TestsContainer for better spacing

### Configuration

- **`.npmignore`**: Added `chromatic.config.json` to npm ignore list

### Code Quality

- **`src/server/providers/browser.ts`**: Added TODO comment regarding story updates

This change improves screenshot consistency by preventing unwanted scrollbars and overflow issues when capturing specific elements with Playwright.
