import { defineConfig, devices } from '@playwright/test';

// NOTE: Default reporter for playwright
const defaultReporter = process.env.CI ? 'dot' : 'list';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './stories/pw-images',
  outputDir: './report',
  testMatch: 'playwright.spec.ts',
  globalSetup: './src/playwright/setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    !process.env.PWDEBUG ? [defaultReporter] : ['null'],
    ['./src/playwright/reporter.ts', { debug: !!process.env.PWDEBUG }],
    // NOTE: use `playwright test --ui` to run tests with Creevey reporter
  ],
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      metadata: {
        storybookGlobals: {},
      },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: 'yarn start:storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
});
