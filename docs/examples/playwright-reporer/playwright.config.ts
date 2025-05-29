import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    // Browser options
    viewport: { width: 1280, height: 720 },
    // Base URL to use in navigation
    baseURL: 'https://example.com', 
  },
  // Configure reporters
  reporter: [
    ['html'], // Standard Playwright HTML reporter
    ['list'], // Console output
    // Creevey reporter with custom configuration
    ['creevey/playwright-reporter', {
      reportDir: './visual-test-results',
      screenDir: './visual-reference-images',
      port: 3030,
      // Performance optimizations
      batchProcessing: true,
      maxConcurrency: 4,
      lazyInit: true,
      // Error handling
      debug: true,
      logFile: './creevey-debug.log',
      // Custom comparison options
      customComparisonOptions: {
        threshold: 0.1, // More tolerant comparison
        ignoreAntialiasing: true
      }
    }]
  ],
});
