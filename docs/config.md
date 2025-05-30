# Creevey Configuration Examples

Creevey is highly configurable and can be tailored to your specific needs. Here are some examples of how to configure Creevey for your Storybook.

## Zero Configuration

The simplest way to get started with Creevey, just run it without any configuration:

```bash
yarn creevey test -s
```

This will start Creevey with default settings, using Chrome as the browser and also start Storybook hosted at `http://localhost:6006`. Adding `--ui` flag will start the web server for the UI Runner.

**NOTE** By default, Creevey uses Selenium WebDriver, but it's done for backward compatibility and it's recommended to define webdriver explicitly in the configuration.

```ts
// creevey.config.ts
import { SeleniumWebdriver } from 'creevey/selenium';

const config = {
  webdriver: SeleniumWebdriver,
};

// or use Playwright instead

import { PlaywrightWebdriver } from 'creevey/playwright';

const config = {
  webdriver: PlaywrightWebdriver,
};
```

## Basic Configuration

The minimal configuration to test your stories might be:

```ts
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,

  // The URL where your Storybook is hosted
  storybookUrl: 'http://localhost:9000',

  // Define which browsers to use for testing
  browsers: {
    chromium: {
      // The browser type name which will be used by Playwright
      browserName: 'chromium',
      // Default viewport dimensions
      viewport: { width: 1024, height: 768 },
      // Limit of retries for failed tests
      maxRetries: 2,
    },
  },
};

export default config;
```

## Multiple Browsers Configuration

It's possible to est your stories across different browsers:

```ts
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,

  browsers: {
    chromium: {
      browserName: 'chromium',
      // Amount of parallel browser sessions
      limit: 2,
    },
    firefox: {
      browserName: 'firefox',
      limit: 2,
    },
  },
};

export default config;
```

## Test stories with different themes

Test your components with different themes:

```ts
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  browsers: {
    dark: {
      browserName: 'chromium',
      // Define a storybook globals which will be applied to the stories
      _storybookGlobals: {
        theme: 'dark',
      },
    },
    light: {
      browserName: 'chromium',
      _storybookGlobals: {
        theme: 'light',
      },
    },
  },
};

export default config;
```

## Using dedicated Selenium Grid server

Use Selenium Grid for distributed testing:

```ts
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { SeleniumWebdriver } from 'creevey/selenium';

const config: CreeveyConfig = {
  webdriver: SeleniumWebdriver,
  // Selenium Grid connection settings
  gridUrl: 'http://selenium-hub:4444/wd/hub',
  browsers: {
    chrome: {
      browserName: 'chrome',
      // You can define any additional selenium capabilities here
      // https://w3c.github.io/webdriver/#capabilities
      seleniumCapabilities: {
        browserVersion: '128.0',
        platformName: 'linux',
      },
    },
  },
};

export default config;
```

## Playwright configuration options

Leverage Playwright for testing:

```ts
// creevey.config.ts
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,
  browsers: {
    chromium: {
      browserName: 'chromium',
      // Playwright-specific options
      // https://playwright.dev/docs/api/class-browsertype#browser-type-launch-server
      playwrightOptions: {
        headless: false,
        channel: 'chrome-canary',
        slowMo: 50, // Slow down Playwright operations by 50ms
      },
    },
  },
};

export default config;
```

## Advanced Configuration

Comprehensive example combining multiple features and additional options:

```ts
// creevey.config.ts
import path from 'path';
import MochaJUnitReporter from 'mocha-junit-reporter';
import { CreeveyConfig } from 'creevey';
import { PlaywrightWebdriver } from 'creevey/playwright';

const config: CreeveyConfig = {
  webdriver: PlaywrightWebdriver,

  // It's possible to resolve Storybook URL at the runtime
  resolveStorybookUrl: () =>
    fetch('https://example.com/resolve-ip')
      .then((res) => res.text())
      .then((data) => `http://${data}:6006`),

  // Define custom reference screenshots directory
  screenDir: path.join(process.cwd(), 'screenshots'),

  // Define custom report directory
  reportDir: path.join(process.cwd(), 'reports'),

  // Define path where Creevey tests are located
  testDir: path.join(process.cwd(), 'tests'),

  // You can use any Mocha-like reporter
  reporter: MochaJUnitReporter,

  // Pixelmatch options
  diffOptions: { threshold: 0.1 },

  // Regex pattern to match test files
  testsRegex: /\.creevey\.ts$/,

  // Disable using docker, to start browsers locally, it's useful for CI
  useDocker: process.env.CI,

  browsers: {
    /* ... */
  },
};
```
