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
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'visual.spec.ts',
  globalSetup: 'creevey/playwright/setup',
  // Configure reporters
  reporter: [
    ['list'], // Standard Playwright reporter for console output
    ['creevey/playwright/reporter'],
  ],
  // Reference images and report will be saved in these directories
  snapshotDir: './images',
  outputDir: './report',
  use: {
    viewport: { width: 1280, height: 720 },
    baseURL: 'http://localhost:6006',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      metadata: {
        // Define storybook globals here (optional)
        storybookGlobals: {
          theme: 'dark',
        },
      },
    },
  ],
  webServer: {
    command: 'yarn storybook dev --ci -p 6006',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Required Configuration

- **Global Setup**: `globalSetup: 'creevey/playwright/setup'` - Required for proper initialization
- **Reporter**: `['creevey/playwright/reporter', options]` - The Creevey reporter
- **Output Directories**: Use standard Playwright `snapshotDir` and `outputDir` options

## Usage

### Basic Test Setup

Create a visual test file using Creevey's `definePlaywrightTests()` function:

```typescript
// tests/visual.spec.ts
import { definePlaywrightTests } from 'creevey/playwright';

definePlaywrightTests();
```

This simple setup will automatically:

- Discover your Storybook stories
- Generate Playwright tests for each story
- Take screenshots and compare them with reference images
- Integrate with the Creevey UI for reviewing differences

### Storybook Globals Configuration

You can configure Storybook globals for each browser project:

```typescript
projects: [
  {
    name: 'chromium-light',
    use: { ...devices['Desktop Chrome'] },
    metadata: {
      storybookGlobals: {
        theme: 'light',
      },
    },
  },
  {
    name: 'chromium-dark',
    use: { ...devices['Desktop Chrome'] },
    metadata: {
      storybookGlobals: {
        theme: 'dark',
      },
    },
  },
];
```

## Running Tests

Run your visual tests with Playwright:

```bash
# Run all tests
yarn playwright test

# Run with debug output
yarn playwright test --debug


# Run tests for specific browser
yarn playwright test --project=chromium
```

### Viewing Results

After running your tests, you can run `yarn creevey report` to start the Creevey UI to review results:

1. The reporter will output the URL where you can view results
2. Navigate to the provided URL in your browser
3. Browse test results, view image comparisons, and approve changes
4. You can re-run playwright tests without restarting Creevey UI. Playwright reporter automatically commit tests updates to Creevey UI

### Approving Screenshots

You can approve screenshots directly from the Creevey UI by:

1. Selecting the test with the failed comparison
2. Reviewing the differences between expected and actual images
3. Clicking the "Approve" button to update the reference image

## Troubleshooting

### Common Issues

**Tests not discovering stories**:

- Ensure your Storybook server is running on the configured URL
- Check that `globalSetup: 'creevey/playwright/setup'` is included in your config
- Verify your `baseURL` points to your Storybook instance

**Screenshots not being captured**:

- Make sure you're using the `definePlaywrightTests()` function
- Check that `snapshotDir` is properly configured and writable

**Port conflicts**:

- If Storybook fails to start, ensure the port isn't already in use
- Configure a different port in the `webServer` configuration

### Storybook Issues

If tests can't connect to Storybook:

1. Ensure Storybook starts successfully with `yarn storybook dev`
2. Check that the URL in `webServer.url` matches your Storybook instance
3. Verify your `baseURL` is correctly configured

For more help, please check the main Creevey documentation or open an issue on GitHub.
