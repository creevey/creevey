---
'creevey': patch
---

Support mts/cts test file extensions, support images in base64 encoding

## Changes

### Test File Extension Support

- **`src/server/config.ts`**: Extended `testsRegex` pattern to support `.mts` and `.cts` file extensions
  - Pattern updated from `/\.creevey\.(t|j)s$/` to `/\.creevey\.(m|c)?(t|j)s$/`
  - Now supports TypeScript module (`.mts`) and CommonJS TypeScript (`.cts`) test files

### Base64 Image Support

- **`src/server/worker/match-image.ts`**: Added support for base64 encoded images
  - New `toBuffer` utility function converts base64 strings to Buffer objects
  - Updated `matchImage` and `matchImages` functions to accept both `Buffer` and `string` (base64) inputs
  - Automatically handles conversion before image processing

### Type Definitions

- **`src/types.ts`**: Updated type definitions for image matching functions
  - `matchImage` and `matchImages` now accept `Buffer | string` instead of just `Buffer`
  - Maintains backward compatibility while enabling base64 image inputs

These changes provide more flexibility in test file organization and image input formats, supporting modern TypeScript module patterns and convenient base64 image handling.
