# Playwright Reporter for Creevey

Creevey provides a Playwright-compatible reporter that allows you to use Creevey's image comparison, reporting, and UI features with Playwright tests.

## Installation

The reporter is included with the Creevey package. Install Playwright and Creevey in your project:

```bash
npm install --save-dev @playwright/test creevey
```

## Configuration

Add the Creevey reporter to your Playwright configuration file:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'], // Standard Playwright reporter for console output
    [
      'creevey/playwright-reporter',
      {
        // Optional configuration options
        reportDir: './report', // Directory for report output
        screenDir: './images', // Directory for reference images
        port: 3000, // Port for Creevey UI server
        debug: false, // Enable debug logging
      },
    ],
  ],
  // Other Playwright configuration...
});
```

## Usage

### Taking Screenshots for Comparison

The reporter automatically collects screenshots taken during Playwright tests. You can use Playwright's built-in screenshot capabilities:

#### Using `page.screenshot()`

```typescript
import { test, expect } from '@playwright/test';

test('capture screenshot with page.screenshot', async ({ page }) => {
  await page.goto('https://example.com');

  // Take a screenshot and attach it to the test result
  const screenshot = await page.screenshot();
  await test.info().attach('example-screenshot', {
    body: screenshot,
    contentType: 'image/png',
  });
});
```

#### Using Playwright's expect().toHaveScreenshot()

```typescript
import { test, expect } from '@playwright/test';

test('capture screenshot with toHaveScreenshot', async ({ page }) => {
  await page.goto('https://example.com');

  // This will automatically be picked up by the Creevey reporter
  await expect(page).toHaveScreenshot('example-screenshot.png');
});
```

### Adding Creevey Metadata

You can add metadata to your tests to better organize them in the Creevey UI:

```typescript
import { test } from '@playwright/test';

test.describe('Homepage', () => {
  test('header elements @creevey{"storyPath": ["Website", "HomePage"], "browser": "chromium"}', async ({ page }) => {
    await page.goto('https://example.com');
    // Test code...
    await page.screenshot({ path: 'header.png' });
  });
});
```

The `@creevey` annotation accepts a JSON object with the following properties:

- `storyPath`: Array of strings defining the hierarchy in the Creevey UI
- `browser`: Browser name (chromium, firefox, webkit)
- `testName`: Custom test name (defaults to the test title)

### Viewing Results

After running your tests, you can view the results in the Creevey UI:

1. Open your browser and navigate to `http://localhost:3000` (or the port you configured)
2. Browse test results, view image comparisons, and approve changes

Run your tests with Playwright:

```bash
npx playwright test
```

The Creevey server will automatically start during the test run, and you'll see a message with the URL once tests complete.

### Approving Screenshots

You can approve screenshots directly from the Creevey UI by:

1. Selecting the test with the failed comparison
2. Reviewing the differences between expected and actual images
3. Clicking the "Approve" button to update the reference image

## Advanced Usage

### Custom Screenshot Names

You can customize screenshot names to better organize your visual tests:

```typescript
test('product page layout', async ({ page }) => {
  await page.goto('https://example.com/products/1');

  // Take multiple screenshots in a single test
  await test.info().attach('product-header', {
    body: await page.locator('.product-header').screenshot(),
    contentType: 'image/png',
  });

  await test.info().attach('product-details', {
    body: await page.locator('.product-details').screenshot(),
    contentType: 'image/png',
  });
});
```

### Multiple Screenshots in One Test

You can capture multiple screenshots in a single test:

```typescript
test('responsive design checks', async ({ page }) => {
  await page.goto('https://example.com');

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await test.info().attach('mobile-view', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  // Tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await test.info().attach('tablet-view', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  await test.info().attach('desktop-view', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});
```

### Custom Test Names

By default, the reporter will use the Playwright test title as the test name. You can customize how tests are named by setting meta data:

```typescript
test('home page visual test', async ({ page }) => {
  test.info().annotations.push({
    type: 'creevey',
    description: JSON.stringify({
      testName: 'custom-test-name',
      browser: 'chrome', // Optional, to override browser name
    }),
  });

  // Test implementation...
});
```

### Integration with Existing Creevey Configuration

If you're already using Creevey for other tests, you can share configuration:

```typescript
import { defineConfig } from '@playwright/test';
import creeveyConfig from './creevey.config.js';

export default defineConfig({
  reporter: [
    ['list'],
    [
      'creevey/playwright-reporter',
      {
        reportDir: creeveyConfig.reportDir,
        screenDir: creeveyConfig.screenDir,
        port: 3001, // Use a different port to avoid conflicts
      },
    ],
  ],
});
```

### Test Steps Integration

The reporter supports Playwright's test steps, capturing screenshots at each step:

```typescript
test('multi-step test', async ({ page }) => {
  await test.step('Step 1: Navigate to home', async () => {
    await page.goto('/');
    // Screenshot captured from this step will be associated with "Step 1"
    await test.info().attach('step1', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Step 2: Click button', async () => {
    await page.click('.button');
    // This screenshot will be associated with "Step 2"
    await test.info().attach('step2', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});
```

### Integration with Existing Creevey Server

If you're already running a Creevey server, you can configure the reporter to use it:

```typescript
[
  CreeveyPlaywrightReporter,
  {
    useExistingServer: true, // Don't start a new server
    port: 3000, // Port of the existing server
  },
];
```

### Performance Optimization

For large test suites with many screenshots, you can enable performance optimizations:

```typescript
[
  CreeveyPlaywrightReporter,
  {
    batchProcessing: true, // Process screenshots in batches
    maxConcurrency: 4, // Maximum concurrent screenshot processing
    lazyInit: true, // Initialize components on demand
  },
];
```

## API Reference

### Reporter Options

| Option                    | Type    | Default      | Description                                           |
| ------------------------- | ------- | ------------ | ----------------------------------------------------- |
| `reportDir`               | string  | `'./report'` | Directory where Creevey will store reports            |
| `screenDir`               | string  | `'./images'` | Directory where reference images are stored           |
| `port`                    | number  | `3000`       | Port number for the Creevey UI server                 |
| `debug`                   | boolean | `false`      | Enable debug logging                                  |
| `uiEnabled`               | boolean | `true`       | Enable or disable the UI server                       |
| `useExistingServer`       | boolean | `false`      | Use an existing Creevey server instance               |
| `batchProcessing`         | boolean | `false`      | Process screenshots in batches for better performance |
| `maxConcurrency`          | number  | `2`          | Maximum concurrent screenshot processing operations   |
| `lazyInit`                | boolean | `false`      | Initialize components on demand for faster startup    |
| `retainOrphanedImages`    | boolean | `false`      | Keep images not associated with current tests         |
| `customComparisonOptions` | object  | `undefined`  | Custom options for image comparison                   |

## Troubleshooting

### Common Issues

- **Port conflicts**: If the Creevey server fails to start, it might be due to port conflicts. Change the port in the configuration.
- **Missing screenshots**: Ensure your tests are attaching screenshots with unique names or using `toHaveScreenshot()`.
- **Path issues**: If reference images aren't found, check that the `screenDir` path is correct and accessible.

If screenshots are not appearing in the Creevey UI:

1. Ensure your screenshots are being properly attached to test results
2. Check that the content type is set to 'image/png' when attaching
3. Enable debug mode in the reporter configuration to see detailed logs

### Server Issues

If the Creevey server fails to start:

1. Check if the configured port is already in use
2. Ensure the report directory is writable
3. Look for error messages in the console output

### Debug Mode

Enable debug logging for more detailed information:

```typescript
[
  CreeveyPlaywrightReporter,
  {
    debug: true,
    // Other options...
  },
];
```

## Error Handling

The reporter is designed to handle errors gracefully:

- If the reporter fails to initialize, tests will still run and screenshots will be captured when possible
- If the server can't start, the reporter will continue to capture screenshots but the UI won't be available
- All errors are logged with appropriate severity levels and won't cause your tests to fail

### Debugging Reporter Issues

For detailed debugging information, enable debug mode and check the logs:

```typescript
[
  CreeveyPlaywrightReporter,
  {
    debug: true,
  },
];
```

You can also specify a custom log file for the reporter:

```typescript
[
  CreeveyPlaywrightReporter,
  {
    debug: true,
    logFile: './creevey-reporter.log',
  },
];
```

For more help, please check the main Creevey documentation or open an issue on GitHub.
