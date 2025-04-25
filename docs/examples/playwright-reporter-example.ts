/**
 * Example of using Creevey's Playwright Reporter
 * 
 * This example demonstrates:
 * 1. Basic configuration in playwright.config.ts
 * 2. Taking and comparing screenshots in tests
 * 3. Using custom test names for better organization
 * 4. Advanced features like test steps and error handling
 * 5. Performance optimizations for large test suites
 */

// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { CreeveyPlaywrightReporter } from 'creevey/playwright';

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
    [CreeveyPlaywrightReporter, {
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

// Example test file: tests/visual.spec.ts
import { test, expect } from '@playwright/test';

// Basic screenshot test
test('homepage visual test', async ({ page }) => {
  await page.goto('/');
  
  // Wait for content to stabilize
  await page.waitForTimeout(1000);
  
  // Take a screenshot and compare it
  await expect(page).toHaveScreenshot('homepage.png');
});

// Test with custom elements and masks
test('product page with dynamic content', async ({ page }) => {
  await page.goto('/products/sample');
  
  // Mask dynamic elements like timestamps or user-specific data
  await expect(page).toHaveScreenshot('product-page.png', {
    mask: [page.locator('.timestamp'), page.locator('.user-greeting')]
  });
});

// Test with custom viewport size
test('mobile view', async ({ page }) => {
  // Override viewport for this test
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/');
  
  // Wait for any responsive adjustments
  await page.waitForTimeout(500);
  
  await expect(page).toHaveScreenshot('homepage-mobile.png');
});

// Test with custom Creevey metadata
test('checkout flow with custom test naming', async ({ page }) => {
  // Add custom Creevey metadata
  test.info().annotations.push({ 
    type: 'creevey', 
    description: JSON.stringify({
      testName: 'checkout-flow',
      browser: 'chromium',
      // Additional metadata as needed
      storyPath: ['E-commerce', 'Checkout']
    })
  });
  
  await page.goto('/cart');
  await page.click('.checkout-button');
  
  // Take multiple screenshots in the same test
  await test.info().attach('step1-shipping', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
  
  await page.fill('#address', '123 Test St');
  await page.click('.continue-button');
  
  await test.info().attach('step2-payment', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
  
  // Final verification
  await expect(page.locator('.payment-form')).toBeVisible();
});

// Test using test steps for better organization
test('multi-step checkout process', async ({ page }) => {
  // Setup test metadata
  test.info().annotations.push({ 
    type: 'creevey', 
    description: JSON.stringify({
      testName: 'multi-step-checkout',
      storyPath: ['E-commerce', 'Checkout', 'Steps']
    })
  });

  await test.step('Step 1: Navigate to cart', async () => {
    await page.goto('/cart');
    // Screenshot will be named with the step name prefix
    await test.info().attach('cart-view', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  });
  
  await test.step('Step 2: Begin checkout', async () => {
    await page.click('.checkout-button');
    await page.waitForSelector('#checkout-form');
    await test.info().attach('checkout-form', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  });
  
  await test.step('Step 3: Fill shipping details', async () => {
    await page.fill('#name', 'Test User');
    await page.fill('#address', '123 Test St');
    await page.fill('#city', 'Test City');
    await page.fill('#zip', '12345');
    await test.info().attach('shipping-details', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  });
  
  await test.step('Step 4: Submit and verify', async () => {
    await page.click('.submit-button');
    await page.waitForSelector('.confirmation-page');
    await test.info().attach('confirmation', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  });
});

// Test demonstrating error handling
test('test with error handling', async ({ page }) => {
  try {
    await page.goto('/potentially-unstable-page');
    
    // Try to take a screenshot even if page is not in ideal state
    try {
      await test.info().attach('best-effort-screenshot', {
        body: await page.screenshot(),
        contentType: 'image/png'
      });
    } catch (screenshotError) {
      console.warn('Could not take screenshot, continuing test:', (screenshotError as Error).message);
    }
    
    // Continue with test if possible
    await page.click('.button');
    
    // Always try to capture final state
    await test.info().attach('final-state', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  } catch (error) {
    // Capture error state
    await test.info().attach('error-state', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
    
    // Re-throw to fail the test
    throw error;
  }
}); 