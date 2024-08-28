## Config/Options

### CLI Options

- `--config` — Specify path to config file. Default `.creevey/config.js` or `creevey.config.js`
- `--ui` — Start runner web server
- `--update` — Approve all images from `report` directory
- `--port` — Specify port for web server. Default `3000`
- `--reportDir` — Path where reports will be stored
- `--screenDir` — Path where reference images are located
- `--debug` — Enable debug output

### Creevey config

In default configuration Creevey take screenshots of `#storybook-root` element only for chrome browser in one concurrent instance, to run tests in different browsers or speedup tests and run in parallel, you need to define config file `.creevey/config.js`

```ts
module.exports = {
  browsers: {
    chrome: {
      browserName: 'chrome',
      // Define initial viewport size
      viewport: { width: 1024, height: 720 },
      // Increase parallel sessions
      limit: 2,
    },
    firefox: {
      browserName: 'firefox',
      viewport: { width: 1024, height: 720 },
    },
  },
};
```

### All possible config options

:warning: **WARN** :warning: This config is just an example with all possible options. :warning: **WARN** :warning:

```ts
const path = require('path');

module.exports = {
  // Specify custom Selenium Grid url (see usage below)
  // In most cases you don't need this option
  gridUrl: '<gridUrl>/wd/hub',

  // Default Storybook url
  storybookUrl: 'http://localhost:6006',

  // Where original images are stored
  screenDir: path.join(__dirname, '../images'),

  // Report directory that contains data from previous runs
  reportDir: path.join(__dirname, '../report'),

  // Pixelmatch options
  diffOptions: { threshold: 0.1 },

  // How many times test should be retried before to consider it as failed
  maxRetries: 2,

  // Describe browsers and their options
  browsers: {
    // Shorthand declarations of browsers
    chrome: true,
    ff: 'firefox',

    otherChrome: {
      browserName: 'chrome',
      // Define initial viewport size
      viewport: { width: 1024, height: 720 },
      // Increase parallel sessions
      limit: 2,
      /* Also you can define any browser capabilities here */
      version: '86.0',
      // It's possible to set Storybook's globals
      // https://github.com/storybookjs/storybook/blob/v6.0.0/docs/essentials/toolbars-and-globals.md
      // NOTE: This is an experimental feature and will be replaced in future
      _storybookGlobals: {
        myTheme: 'dark',
      },
    },

    // You can override some global options for specific browser
    ie11: {
      browserName: 'internet explorer',
      // Like user another Selenium Grid url
      gridUrl: '<anotherGridUrl>/wd/hub',
      // Or use different storybook instance
      storybookUrl: 'http://mystoryhost:6007',
      // And use you own docker image
      // By default Creevey will use selenoid image according browser name and version:
      // `selenoid/${browserName}:${version ?? 'latest'}` image
      dockerImage: 'microsoft/ie:11.0',
    },
  },

  // You may want to do something before tests started (for example start browserstack-local)
  hooks: {
    async before() {
      /* ... */
    },
    async after() {
      /* ... */
    },
  },
};
```

### Storybook parameters

Also you could define parameters on `global`, `kind` or `story` levels. All these parameters are deeply merged by Storybook for each story. But bear in mind when you define skip option as an array Storybook treats it as primitive value and doesn't merge with other skip options.

```tsx
// .storybook/preview.tsx
export const parameters = {
  creevey: {
    // Skip all *hover tests in IE11 on the global level
    skip: {
      "hovers don't work in ie11": { in: 'ie11', tests: /.*hover$/ },
    },
  },
};
```

```tsx
import React from 'react';
import { Meta, Story } from '@storybook/react';
import { CreeveyMeta, CreeveyStory } from 'creevey';
import MyComponent from './src/components/MyComponent';

export default {
  title: 'MyComponent'
  parameters: {
    creevey: {
      // You could skip some browsers/stories or even specific tests
      skip: {
        "`MyComponent` doesn't support ie11": { in: 'ie11' },
        "Loading stories are flaky in firefox": { in: 'firefox', stories: 'Loading' },
        "`MyComponent` hovering doesn't work correctly": {
          in: ['firefox', 'chrome'],
          tests: /.*hover$/,
        },
      },
    },
  },
} as Meta & CreeveyMeta;

export const Basic: Story & CreeveyStory = () => <MyComponent />;
Basic.parameters = {
  creevey: {
    captureElement: '.container',
    // elements to ignore in capturing screenshot
    ignoreElements: ['button', '.local-time'],
    // Delay before test starts in ms
    delay: 1000,
    tests: {
      /* ... */
    },
  },
};
```

### `skip` option examples:

```ts
interface SkipOption {
  in?: string | string[] | RegExp;
  kinds?: string | string[] | RegExp;
  stories?: string | string[] | RegExp;
  tests?: string | string[] | RegExp;
}

type SkipOptions = boolean | string | Record<string, SkipOption | SkipOption[]>;
```

- Skip all stories for all browsers:
  - `skip: true`
  - `skip: 'Skip reason message'`
  - `skip: { 'Skip reason message': true }`
- Skip all stories for specific browsers:
  - `skip: { 'Skip reason message': { in: 'ie11' } }`
  - `skip: { 'Skip reason message': { in: ['ie11', 'chrome'] } }`
  - `skip: { 'Skip reason message': { in: /^fire.*/ } }`
- Skip all stories in specific kinds:
  - `skip: { 'Skip reason message': { kinds: 'Button' } }`
  - `skip: { 'Skip reason message': { kinds: ['Button', 'Input'] } }`
  - `skip: { 'Skip reason message': { kinds: /.*Modal$/ } }`
- Skip all tests in specific stories:
  - `skip: { 'Skip reason message': { stories: 'simple' } }`
  - `skip: { 'Skip reason message': { stories: ['simple', 'special'] } }`
  - `skip: { 'Skip reason message': { stories: /.*large$/ } }`
- Skip specific tests:
  - `skip: { 'Skip reason message': { tests: 'click' } }`
  - `skip: { 'Skip reason message': { tests: ['hover', 'click'] } }`
  - `skip: { 'Skip reason message': { tests: /^press.*$/ } }`
- Multiple skip options:
  - for one reason
    ```
    skip: {
      "reason": [{ /* ... */ }, { /* ... */ }],
    }
    ```
  - for several reasons
    ```
    skip: {
      "reason 1": { /* ... */ },
      "reason 2": { /* ... */ },
    }
    ```

NOTE: If you try to skip stories by story name, the storybook name format will be used (For more info see [storybook-export-vs-name-handling](https://storybook.js.org/docs/formats/component-story-format/#storybook-export-vs-name-handling))
