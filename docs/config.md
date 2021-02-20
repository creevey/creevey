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

In default configuration Creevey take screenshots of `#root` element only for chrome browser in one concurrent instance, to run tests in different browsers or speedup tests and run in parallel, you need to define config file `.creevey/config.js`

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

  // Storybook config directory
  storybookDir: path.join(__dirname, '.storybook'),

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

Also you could define parameters on `kind` or `story` levels. All these parameters are deeply merged by storybook for each story.

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
      skip: [
        { in: 'ie11', reason: '`MyComponent` do not support IE11' },
        { in: 'firefox', stories: 'Loading' },
        {
          in: ['firefox', 'chrome'],
          tests: /.*hover$/,
          reason: 'For some reason `MyComponent` hovering do not work correctly',
        },
      ],
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

- Skip all stories for all browsers:
  - `skip: 'Skip reason message'`
  - `skip: { reason: 'Skip reason message' }`
- Skip all stories for specific browsers:
  - `skip: { in: 'ie11' }`
  - `skip: { in: ['ie11', 'chrome'] }`
  - `skip: { in: /^fire.*/ }`
- Skip all stories in specific kinds:
  - `skip: { kinds: 'Button' }`
  - `skip: { kinds: ['Button', 'Input'] }`
  - `skip: { kinds: /.*Modal$/ }`
- Skip all tests in specific stories:
  - `skip: { stories: 'simple' }`
  - `skip: { stories: ['simple', 'special'] }`
  - `skip: { stories: /.*large$/ }`
- Skip specific tests:
  - `skip: { tests: 'click' }`
  - `skip: { tests: ['hover', 'click'] }`
  - `skip: { tests: /^press.*$/ }`
- Multiple skip options: `skip: [{ /* ... */ }]`

NOTE: If you try to skip stories by story name, the storybook name format will be used (For more info see [storybook-export-vs-name-handling](https://storybook.js.org/docs/formats/component-story-format/#storybook-export-vs-name-handling))
