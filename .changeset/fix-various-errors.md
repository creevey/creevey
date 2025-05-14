---
'creevey': patch
---

Fix various errors and improve webdriver separation

- Fixed import path in base config from `index.js` to `playwright.js`
- Added proper exports for `./playwright` and `./selenium` in package.json
- Created backward compatibility declaration files for playwright and selenium
- Separated playwright and selenium webdriver exports from main index
- Improved config loading to handle nested defaults and set default webdriver
- Fixed selenium screenshot composition to return proper PNG buffer
- Added afterTest method to webdriver interface for better test cleanup
- Updated playwright docker container to use versioned images
- Added webdriver context to test types with proper type declarations
- Fixed CLI path in package.json bin field
- Various TypeScript and import fixes for better module resolution
