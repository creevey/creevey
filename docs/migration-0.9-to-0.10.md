# Migrating from Creevey 0.9 to 0.10

This guide outlines the key changes and steps required to update your Creevey setup from version 0.9 to 0.10. Version 0.10 introduces several significant updates, including Playwright support, a new test context API, and changes to configuration.

---

## Breaking Changes

### 0. Addon Removal (Breaking Change)

The Creevey Storybook addon has been removed in 0.10. Creevey now runs as a standalone Web UI and reads Storybook parameters directly from your stories/config.

What you need to do:

- Remove `'creevey'` from your `.storybook/main.ts` `addons` list.
- Remove any Creevey decorators/imports you previously added for the addon.
- Keep your Creevey parameters in `preview.ts`/stories — they are still supported and picked up by the runner.
- Use the Web UI to run tests: `yarn creevey test -s --ui` (adds Storybook autostart with `-s`).

Implications:

- Tests are no longer started/controlled from inside the Storybook panel. Open the Creevey Web UI at `http://localhost:3000` instead.
- Approvals and diffs are handled in the Creevey UI (`creevey report` for reviewing past runs).

### 1. CLI Commands Structure (Breaking Change)

Creevey 0.10 introduces a command-based CLI structure. You can no longer run Creevey without specifying a command.

**Before (0.9):**

```bash
# Running tests
creevey --ui
creevey -s --ui
creevey --debug

# Update mode (approving images all at once with no way to review them)
creevey --update

# Viewing reports
# Doesn't have this feature
```

**After (0.10):**

```bash
# Running tests
creevey test --ui
creevey test -s --ui
creevey test --debug

# Viewing reports (approving images)
creevey report
creevey report ./custom-report-dir
```

**Key Changes:**

- All test execution now requires the `test` command
- Image approval/update mode uses the `report` command instead of `-u/--update` flags
- Report viewing uses the `report` command

### 2. Browser Configuration in `creevey.config.ts`

The way browsers are configured has been updated to better distinguish between Selenium and Playwright settings.

- The new `webdriver` field lets you choose your WebDriver implementation. While it defaults to Selenium for now, this may change. We recommend explicitly setting it by importing and using either `SeleniumWebdriver` or `PlaywrightWebdriver`.
- Selenium-specific capabilities (e.g., `browserVersion`, `platformName`) must now be nested under a `seleniumCapabilities` object.
- Playwright-specific options should be placed under a `playwrightOptions` object.

**Before (0.9):**

```javascript
// creevey.config.js
export default {
  browsers: {
    chrome: {
      browserName: 'chrome',
      browserVersion: '90.0',
      platformName: 'linux',
    },
  },
};
```

**After (0.10):**

```typescript
// creevey.config.ts
import type { CreeveyConfig } from 'creevey';
import { SeleniumWebdriver } from 'creevey/selenium';
// or
// import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: SeleniumWebdriver, // or PlaywrightWebdriver
  browsers: {
    chrome: {
      // For Selenium
      browserName: 'chrome',
      seleniumCapabilities: {
        browserVersion: '90.0',
        platformName: 'linux',
      },
    },
    firefoxPlaywright: {
      // For Playwright
      browserName: 'firefox', // 'chromium', 'firefox', or 'webkit' for Playwright
      playwrightOptions: {
        headless: true,
      },
    },
  },
};

export default config;
```

### 3. Mocha Removal and New `CreeveyTestContext` API

Creevey no longer uses the Mocha testing framework. Tests now use a `CreeveyTestContext` object passed as an argument to the test function.

- Replace `this` with the `context` parameter in your tests.
- Image matching methods (e.g., `matchImage`, `takeScreenshot`) are now called on the `context` object.
- The `context.webdriver` property gives you direct access to the configured WebDriver instance (Selenium or Playwright) for advanced browser interactions.

**Before (0.9 - Mocha style):**

```javascript
it('should match the image', async function () {
  this.expect(await this.takeScreenshot()).to.matchImage('example');
});
```

**After (0.10 - New context style):**

```javascript
it('should match the image', async (context) => {
  await context.matchImage(await context.takeScreenshot(), 'example');
});

// Example using context.webdriver with Selenium WebDriver API
it('should interact with an element using Selenium', async (context) => {
  const seleniumWebDriver = context.webdriver; // Assuming SeleniumWebdriver is configured
  const element = await seleniumWebDriver.findElement({ css: '#myElement' });
  await element.click();
  // ... more Selenium interactions
  await context.matchImage(await context.takeScreenshot(), 'selenium-interaction');
});

// Example using context.webdriver with Playwright API
it('should interact with an element using Playwright', async (context) => {
  const playwrightPage = context.webdriver; // Assuming PlaywrightWebdriver is configured
  await playwrightPage.click('#myElement');
  // ... more Playwright interactions
  await context.matchImage(await context.takeScreenshot(), 'playwright-interaction');
});
```

### 4. Reporter Configuration

Reporter setup has moved from command-line options to the `creevey.config.ts` file.

**Example (0.10):**

```typescript
// creevey.config.ts
import type { CreeveyConfig } from 'creevey';

const config: CreeveyConfig = {
  reporter: 'junit', // or 'teamcity', 'creevey'
  reporterOptions: {
    // For JUnit: { outputFile: 'report.xml' }
    // For Creevey HTML reporter (default): { reportDir: './report' }
  },
};

export default config;
```

---

## Key New Features & Updates

- **Creevey Playwright Reporter:** Integrate Creevey's visual testing into your existing Playwright test suites. See `docs/playwright-reporter.md` for details.
- **Approve Tests from Report UI (Update Mode):** Approve visual changes directly in the Creevey report UI. Run with `creevey report` to use the web UI for reviewing and approving screenshots.
- **ODiff Image Comparison:** Use `odiff` for image comparison with the `--odiff` flag and `odiffOptions` in config.
- **Easier Storybook Autostart:** Use `creevey test -s` or `creevey test --storybook-start` to automatically start Storybook. Creevey will find a free port if necessary.

---

## Other Notable Changes

- **`--no-docker` Option:** A command-line flag to disable Docker, overriding `useDocker: true` in your config.

---

We recommend reviewing the full announcement for details on all new features and improvements. After updating, test your suite thoroughly to ensure a smooth transition.
