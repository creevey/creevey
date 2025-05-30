import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'visual.spec.ts',
  globalSetup: 'creevey/playwright/setup',
  // Configure reporters
  reporter: [
    ['list'],
    // Creevey reporter with debug enabled when playwright is run with `--debug` flag
    ['creevey/playwright/reporter', { debug: !!process.env.PWDEBUG }],
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
        // Define storybook globals here
        storybookGlobals: {
          theme: 'dark',
        },
      },
    }
  ],
  webServer: {
    command: 'yarn storybook dev --ci -p 6006',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
});
