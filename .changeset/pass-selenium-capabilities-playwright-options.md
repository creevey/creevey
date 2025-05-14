---
'creevey': minor
---

Pass selenium capabilities and playwright options separately

- **BREAKING**: Restructured browser configuration - `browserVersion` and `platformName` moved to `seleniumCapabilities` object
- **BREAKING**: Custom selenium capabilities should now be placed in `seleniumCapabilities` object
- Added `playwrightOptions` for playwright-specific launch options
- Updated package.json exports to put types before default
- Increased default diff threshold from 0.05 to 0.1
- Improved shutdown handling in worker queue
- Added test duration display to pass logs
- Added backwards compatibility support for old config format in telemetry

Migration guide:

```js
// Before
browsers: {
  chrome: {
    browserName: 'chrome',
    browserVersion: '90.0',
    platformName: 'linux',
    customSeleniumOption: 'value'
  }
}

// After
browsers: {
  chrome: {
    browserName: 'chrome',
    seleniumCapabilities: {
      browserVersion: '90.0',
      platformName: 'linux',
      customSeleniumOption: 'value'
    },
    playwrightOptions: {
      // playwright launch options
    }
  }
}
```
