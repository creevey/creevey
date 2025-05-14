---
'creevey': patch
---

Fix load images in report mode

## Changes

### Image URL Generation Fix

- **`src/client/shared/helpers.ts`**: Updated `getImageUrl` function to handle report mode correctly
  - Added optional `isReport` parameter to control URL generation logic
  - Prevents adding `/report` prefix when already in report mode
  - Fixes incorrect image paths that prevented images from loading in generated reports

### Context Integration

- **`src/client/shared/components/PageHeader/PageHeader.tsx`**:

  - Added CreeveyContext usage to access `isReport` state
  - Passes `isReport` flag to `getImageUrl` for proper URL generation

- **`src/client/shared/components/ResultsPage.tsx`**:
  - Added CreeveyContext usage to access `isReport` state
  - Passes `isReport` flag to `getImageUrl` for proper URL generation

### Impact

This fix ensures that images are properly loaded in both live Creevey interface and generated HTML reports by constructing the correct image URLs based on the current mode.
