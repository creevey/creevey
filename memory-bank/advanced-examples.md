# Creevey Advanced Examples

This document provides advanced usage examples and techniques for Creevey, helping developers implement more complex visual testing scenarios.

## Table of Contents

1. [Testing Complex Interactions](#testing-complex-interactions)
2. [Testing Animations](#testing-animations)
3. [Parameterized Tests](#parameterized-tests)
4. [Testing with Data](#testing-with-data)
5. [Cross-Browser Tests](#cross-browser-tests)
6. [Integration with Design Systems](#integration-with-design-systems)

## Testing Complex Interactions

### Multi-Step Form Testing

This example demonstrates testing a multi-step form with validation:

```typescript
// MultiStepForm.creevey.ts
import { kind, story, test } from 'creevey';

kind('Forms/MultiStepForm', () => {
  story('Registration', () => {
    test('complete flow', async (context) => {
      const { webdriver } = context;
      const screenshots = {};

      // Step 1: Initial state
      screenshots.step1 = await context.takeScreenshot();

      // Fill in first form page
      await webdriver.findElement('#firstName').type('John');
      await webdriver.findElement('#lastName').type('Doe');
      await webdriver.findElement('#email').type('john.doe@example.com');
      screenshots.step1Filled = await context.takeScreenshot();

      // Submit first page
      await webdriver.findElement('button[type="submit"]').click();
      await webdriver.waitForElement('#address');
      screenshots.step2 = await context.takeScreenshot();

      // Fill in second form page
      await webdriver.findElement('#address').type('123 Main St');
      await webdriver.findElement('#city').type('Springfield');
      await webdriver.findElement('#zipCode').type('12345');
      screenshots.step2Filled = await context.takeScreenshot();

      // Submit second page
      await webdriver.findElement('button[type="submit"]').click();
      await webdriver.waitForElement('#cardNumber');
      screenshots.step3 = await context.takeScreenshot();

      // Fill in payment details
      await webdriver.findElement('#cardNumber').type('4111111111111111');
      await webdriver.findElement('#expiry').type('12/25');
      await webdriver.findElement('#cvv').type('123');
      screenshots.step3Filled = await context.takeScreenshot();

      // Submit final page
      await webdriver.findElement('button[type="submit"]').click();
      await webdriver.waitForElement('.confirmation-message');
      screenshots.confirmation = await context.takeScreenshot();

      // Match all screenshots
      await context.matchImages(screenshots);
    });
  });
});
```

### Drag and Drop Interactions

Example of testing drag and drop functionality:

```typescript
// DragDrop.creevey.ts
import { kind, story, test } from 'creevey';

kind('Interactions/DragDrop', () => {
  story('Kanban Board', () => {
    test('move task between columns', async (context) => {
      const { webdriver } = context;

      // Get initial state
      const initial = await context.takeScreenshot();

      // Find drag source and target
      const dragSource = await webdriver.findElement('.task-card:nth-child(1)');
      const dropTarget = await webdriver.findElement('.column:nth-child(2) .task-list');

      // Perform drag and drop
      await webdriver.dragAndDrop(dragSource, dropTarget);

      // Wait for the animation to complete
      await webdriver.sleep(500);

      // Capture after drag and drop
      const afterDrag = await context.takeScreenshot();

      // Match images
      await context.matchImages({
        initial,
        afterDrag,
      });
    });
  });
});
```

## Testing Animations

> **Important Note:** Creevey automatically disables CSS animations in stories by default to prevent flaky tests. While GIF and JavaScript-based animations might still run, CSS animations and transitions will be disabled. This section provides approaches for handling this limitation.

### Capturing Animation Frames

Testing an animation sequence by capturing key frames, using JavaScript-based animations that won't be affected by Creevey's CSS animation disabling:

```typescript
// Animation.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/Animation', () => {
  story('Loader', () => {
    test('animation sequence', async (context) => {
      const { webdriver } = context;
      const frames = {};

      // Start the JS-based animation
      await webdriver.findElement('#start-animation').click();

      // Capture frames at specific intervals
      frames.start = await context.takeScreenshot();

      // Captured fixed points in the animation
      for (let i = 1; i <= 5; i++) {
        // Control animation state through JavaScript rather than waiting for CSS transitions
        await webdriver.executeScript(`window.advanceAnimationToStep(${i});`);
        frames[`frame${i}`] = await context.takeScreenshot();
      }

      // Match all frames
      await context.matchImages(frames);
    });
  });
});
```

### Testing with Animation Disabled

Since Creevey already disables CSS animations, this approach focuses on explicitly testing different states rather than trying to capture transitions:

```typescript
// Button.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/Button', () => {
  story('States', () => {
    test('visual states without animation', async (context) => {
      const { webdriver } = context;

      // Ensure animations are completely disabled (Creevey does this by default for CSS)
      await webdriver.executeScript(`
        // Disable any JavaScript animations that may still be running
        window.disableJsAnimations && window.disableJsAnimations();
      `);

      // Test different states
      const button = await webdriver.findElement('button');
      const default_ = await context.takeScreenshot();

      await button.hover();
      const hover = await context.takeScreenshot();

      await button.click();
      const active = await context.takeScreenshot();

      // Programmatically set other states that would normally be animated
      await webdriver.executeScript(`
        document.querySelector('button').classList.add('expanded');
      `);
      const expanded = await context.takeScreenshot();

      // Match all discrete states
      await context.matchImages({
        default: default_,
        hover,
        active,
        expanded,
      });
    });
  });
});
```

### Testing Animation End States

A reliable approach to test animations is to focus on their end states rather than the transitions:

```typescript
// AnimationEndState.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/Accordion', () => {
  story('Expand/Collapse', () => {
    test('end states only', async (context) => {
      const { webdriver } = context;
      const states = {};

      // Initial collapsed state
      states.collapsed = await context.takeScreenshot();

      // Trigger expand action
      await webdriver.findElement('.accordion-header').click();

      // Immediately jump to end state using JS instead of waiting for animation
      await webdriver.executeScript(`
        // Force expanded state immediately
        const accordion = document.querySelector('.accordion-content');
        accordion.style.transition = 'none';
        accordion.style.height = 'auto';
        accordion.setAttribute('data-state', 'expanded');
      `);

      states.expanded = await context.takeScreenshot();

      // Match the beginning and end states only
      await context.matchImages(states);
    });
  });
});
```

## Parameterized Tests

### Testing with Different Themes

Testing a component across multiple themes:

```typescript
// ThemeTest.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/Card', () => {
  story('Themed', () => {
    // Define themes to test
    const themes = ['light', 'dark', 'high-contrast', 'brand'];

    themes.forEach((theme) => {
      test(`${theme} theme`, async (context) => {
        const { webdriver } = context;

        // Set the theme
        await webdriver.executeScript(`
          document.body.setAttribute('data-theme', '${theme}');
        `);

        // Wait for theme to apply
        await webdriver.sleep(100);

        // Take screenshot
        const screenshot = await context.takeScreenshot();
        await context.matchImage(screenshot);
      });
    });
  });
});
```

### Testing with Different Data Sets

Testing a component with different data inputs:

```typescript
// DataTable.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/DataTable', () => {
  story('Responsive', () => {
    // Test data sets
    const datasets = [
      { name: 'empty', rows: 0 },
      { name: 'few-rows', rows: 3 },
      { name: 'many-rows', rows: 20 },
      { name: 'many-columns', rows: 5, columns: 10 },
    ];

    datasets.forEach((dataset) => {
      test(`with ${dataset.name} data`, async (context) => {
        const { webdriver } = context;

        // Configure the data table with the specific dataset
        await webdriver.executeScript(`
          window.configureTable({
            rows: ${dataset.rows},
            columns: ${dataset.columns || 5}
          });
        `);

        // Wait for table to render
        await webdriver.sleep(100);

        // Take screenshot at different viewport sizes
        await webdriver.setViewportSize({ width: 1280, height: 800 });
        const desktop = await context.takeScreenshot();

        await webdriver.setViewportSize({ width: 768, height: 1024 });
        const tablet = await context.takeScreenshot();

        await webdriver.setViewportSize({ width: 375, height: 667 });
        const mobile = await context.takeScreenshot();

        // Match all screenshots
        await context.matchImages({
          desktop,
          tablet,
          mobile,
        });
      });
    });
  });
});
```

## Testing with Data

### Testing with API Mocks

Testing a component with mocked API responses:

```typescript
// UserProfile.creevey.ts
import { kind, story, test } from 'creevey';

kind('Pages/UserProfile', () => {
  story('States', () => {
    test('with different API responses', async (context) => {
      const { webdriver } = context;
      const screenshots = {};

      // Mock API for loading state
      await webdriver.executeScript(`
        window.mockApi = {
          response: null,
          loading: true,
          error: null
        };
      `);
      await webdriver.sleep(100);
      screenshots.loading = await context.takeScreenshot();

      // Mock API for error state
      await webdriver.executeScript(`
        window.mockApi = {
          response: null,
          loading: false,
          error: "Failed to load user data"
        };
      `);
      await webdriver.sleep(100);
      screenshots.error = await context.takeScreenshot();

      // Mock API for success state with data
      await webdriver.executeScript(`
        window.mockApi = {
          response: {
            name: "Jane Smith",
            email: "jane.smith@example.com",
            avatar: "https://placekitten.com/100/100",
            role: "Administrator",
            lastLogin: "2023-06-15T10:30:00Z"
          },
          loading: false,
          error: null
        };
      `);
      await webdriver.sleep(100);
      screenshots.success = await context.takeScreenshot();

      // Match all screenshots
      await context.matchImages(screenshots);
    });
  });
});
```

### Testing with Dynamic Data

Ensuring consistent screenshots with dynamic content:

```typescript
// DynamicContent.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/Dashboard', () => {
  story('KPI Cards', () => {
    test('with normalized data', async (context) => {
      const { webdriver } = context;

      // Set fixed date for tests
      await webdriver.executeScript(`
        // Mock current date to a fixed value
        const fixedDate = new Date('2023-06-15T12:00:00Z');
        
        // Override Date constructor
        const OriginalDate = Date;
        window.Date = class extends OriginalDate {
          constructor(...args) {
            if (args.length === 0) {
              return fixedDate;
            }
            return new OriginalDate(...args);
          }
          
          static now() {
            return fixedDate.getTime();
          }
        };
        
        // Normalize random values in charts
        window.getRandomData = () => {
          return [65, 59, 80, 81, 56, 55, 40];
        };
        
        // Force redraw components
        if (window.renderDashboard) {
          window.renderDashboard();
        }
      `);

      // Wait for re-render
      await webdriver.sleep(200);

      // Take screenshot
      const screenshot = await context.takeScreenshot();
      await context.matchImage(screenshot);
    });
  });
});
```

## Cross-Browser Tests

### Browser-Specific Tests

Testing browser-specific behaviors with custom expectations:

```typescript
// BrowserSpecific.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/AudioPlayer', () => {
  story('Controls', () => {
    test('browser-specific behavior', async (context) => {
      const { webdriver, browserName } = context;

      // Click the play button
      await webdriver.findElement('.play-button').click();

      if (browserName.includes('firefox')) {
        // Firefox-specific test steps
        await webdriver.waitForElement('.firefox-permission-dialog');
        await webdriver.findElement('.firefox-permission-dialog .allow-button').click();
      }

      // Continue with common test steps
      await webdriver.waitForElement('.playing-indicator');

      // Take browser-specific screenshot
      const screenshot = await context.takeScreenshot();
      await context.matchImage(screenshot);
    });
  });
});
```

### Custom Browser Capabilities

Setting custom browser capabilities for testing:

```typescript
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  browsers: {
    chromium: {
      browserName: 'chromium',
      viewport: { width: 1280, height: 720 },
      playwrightOptions: {
        headless: false,
        args: [
          '--disable-web-security',
          '--allow-file-access-from-files',
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
        ],
      },
    },
    firefox: {
      browserName: 'firefox',
      viewport: { width: 1280, height: 720 },
      playwrightOptions: {
        headless: false,
        firefoxUserPrefs: {
          'media.navigator.streams.fake': true,
          'media.navigator.permission.disabled': true,
        },
      },
    },
  },
};

export default config;
```

## Integration with Design Systems

### Testing Design Tokens

Testing component rendering with different design tokens:

```typescript
// DesignTokens.creevey.ts
import { kind, story, test } from 'creevey';

kind('DesignSystem/Tokens', () => {
  story('ColorPalette', () => {
    test('color accessibility', async (context) => {
      const { webdriver } = context;

      // Toggle between different color modes
      const colorModes = ['default', 'accessible', 'high-contrast'];
      const screenshots = {};

      for (const mode of colorModes) {
        await webdriver.executeScript(`
          document.documentElement.setAttribute('data-color-mode', '${mode}');
        `);

        // Wait for color changes to apply
        await webdriver.sleep(100);

        screenshots[mode] = await context.takeScreenshot();
      }

      // Match all screenshots
      await context.matchImages(screenshots);
    });
  });

  story('Typography', () => {
    test('font scaling', async (context) => {
      const { webdriver } = context;

      // Test different font scale settings
      const fontScales = [0.8, 1, 1.2, 1.5];
      const screenshots = {};

      for (const scale of fontScales) {
        await webdriver.executeScript(`
          document.documentElement.style.fontSize = '${scale * 16}px';
        `);

        // Wait for font changes to apply
        await webdriver.sleep(100);

        screenshots[`scale-${scale}`] = await context.takeScreenshot();
      }

      // Match all screenshots
      await context.matchImages(screenshots);
    });
  });
});
```

### Component Variations

Testing multiple variants of a component:

```typescript
// Button.creevey.ts
import { kind, story, test } from 'creevey';

kind('Components/Button', () => {
  story('Variants', () => {
    test('all variants', async (context) => {
      const { webdriver } = context;

      // Define component variations to test
      const variations = [
        { size: 'small', variant: 'primary' },
        { size: 'small', variant: 'secondary' },
        { size: 'small', variant: 'tertiary' },
        { size: 'medium', variant: 'primary' },
        { size: 'medium', variant: 'secondary' },
        { size: 'medium', variant: 'tertiary' },
        { size: 'large', variant: 'primary' },
        { size: 'large', variant: 'secondary' },
        { size: 'large', variant: 'tertiary' },
      ];

      const screenshots = {};

      // Test each variation
      for (const { size, variant } of variations) {
        // Update component props
        await webdriver.executeScript(`
          window.updateButtonProps({
            size: '${size}',
            variant: '${variant}'
          });
        `);

        // Wait for updates to apply
        await webdriver.sleep(50);

        // Take screenshot
        screenshots[`${size}-${variant}`] = await context.takeScreenshot();
      }

      // Match all screenshots
      await context.matchImages(screenshots);
    });
  });
});
```

### Theme Switching with CSS Variables

Testing theme switching with CSS variables:

```typescript
// ThemeSwitching.creevey.ts
import { kind, story, test } from 'creevey';

kind('DesignSystem/Themes', () => {
  story('ThemeSwitcher', () => {
    test('all themes', async (context) => {
      const { webdriver } = context;
      const screenshots = {};

      // Define themes to test
      const themes = ['light', 'dark', 'brand-blue', 'brand-green', 'high-contrast'];

      for (const theme of themes) {
        // Switch theme
        await webdriver.executeScript(`
          document.documentElement.setAttribute('data-theme', '${theme}');
          
          // Force transition to complete immediately
          document.body.style.transition = 'none';
          
          // Trigger reflow
          void document.body.offsetHeight;
        `);

        // Wait for theme to apply
        await webdriver.sleep(100);

        screenshots[theme] = await context.takeScreenshot();
      }

      // Match all screenshots
      await context.matchImages(screenshots);
    });
  });
});
```
