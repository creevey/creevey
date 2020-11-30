# Creevey

## Intro

Screenshot testing tool for [Storybook](https://storybook.js.org/) with fancy UI Runner. Creevey integrates with your Storybook and generates screenshot tests from stories in runtime. It allows you to write interaction tests for your stories, review screenshot diffs, and approve them in an easy way from UI Runner. It has docker support and you get deterministic screenshot images in any environment. And it also has some other features, like cross-browser testing, test hot-reloading, CI ready. It named after [Colin Creevey](https://harrypotter.fandom.com/wiki/Colin_Creevey) character from the Harry Potter universe.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

![Creevey Demo](https://user-images.githubusercontent.com/6397708/84031069-7cb71b80-a9ae-11ea-8109-2a5628879029.gif)

## Contents

- [Pre-requisites](#pre-requisites)
- [How to Start](#how-to-start)
- [Comparison with other tools](#comparison-with-other-tools)
- [Config/Options](#configoptions)
  - [CLI Options](#cli-options)
  - [Creevey config](#creevey-config)
  - [Storybook parameters](#storybook-parameters)
- [Use your Selenium Grid (BrowserStack/SauceLabs/etc)](#use-your-selenium-grid-browserstacksaucelabsetc)
- [Write tests](#write-tests)
- [Creevey under the hood](#creevey-under-the-hood)
- [Future plans](#future-plans)
- [Known issues](#known-issues)
- [Used by](#used-by)

## Pre-requisites

- Make sure you have installed [Docker](https://www.docker.com/products/docker-desktop). But if you going to use your own separate Selenium Grid, you don't need `Docker`.

## How to start

- Install `creevey` package

```bash
yarn add -D creevey
```

- Add addon `creevey` into your storybook config

```js
// .storybook/main.js
module.exports = {
  stories: [
    /* ... */
  ],
  addons: [
    /* ... */
    'creevey',
  ],
};
```

- Start storybook and Creevey UI Runner. (To start tests from CLI, run Creevey without `--ui` flag)

```bash
yarn start-storybook -p 6006
yarn creevey --ui
```

And that's it. In first run you may noticed, that all you tests are failing, it because you don't have source screenshot images yet. If you think, that all images are acceptable, you may approve them all in one command `yarn creevey --update`.

## Comparison with other tools

| Features\Tools    | Creevey            | Storyshots         | Hermione           | Loki               | BackstopJS         | Percy/Happo        | Chromatic          |
| ----------------- | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| Easy-to-Setup     | :heavy_check_mark: | :warning:          | :no_entry:         | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: |
| Cross-browser     | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :warning:          | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: |
| Storybook Support | :heavy_check_mark: | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: |
| Test Interaction  | :heavy_check_mark: | :warning:          | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :no_entry:         | :no_entry:         |
| UI Test Runner    | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Built-in Docker   | :heavy_check_mark: | :no_entry:         | :no_entry:         | :heavy_check_mark: | :heavy_check_mark: | :warning:          | :warning:          |
| Tests hot-reload  | :heavy_check_mark: | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         | :no_entry:         |
| OpenSource/SaaS   | OpenSource         | OpenSource         | OpenSource         | OpenSource         | OpenSource         | SaaS               | SaaS               |

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

In default configuration Creevey take screenshots of `#root` element only for chrome browser in one concurrent instance, to run tests in different browsers or speedup tests and run in parallel, you need to define config file `.creevey/config.js`, here is example of possible options

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
  screenDir: path.join(__dirname, 'images'),

  // Report directory that contains data from previous runs
  reportDir: path.join(__dirname, 'report'),

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

You could specify screenshot test parameters for each story you have. For example you might want to capture whole viewport instead of root element. To achieve this you could define parameters on global level. Or you may pass any different css selector.

```typescript
// .storybook/preview.js

export const parameters = { creevey: { captureElement: null } };
```

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
    // Delay before test starts in ms
    delay: 1000
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

## Use your Selenium Grid (BrowserStack/SauceLabs/etc)

Sometimes you already have Selenium Grid on one of many different e2e testing services, like BrowserStack or SauceLabs , or use self-hosted one. You could use these services. If your Selenium Grid located in same network where you going to start Creevey, you will need to define `gridUrl` parameter in Creevey config. Overwise you need to start tunneling tool depends of what Grid you use:

- [browserstack-local](https://www.npmjs.com/package/browserstack-local)
- [sauce-connect-launcher](https://www.npmjs.com/package/sauce-connect-launcher)
- [open-ssh-tunnel](https://www.npmjs.com/package/open-ssh-tunnel)

To start one of these tool use `before/after` hook parameters in Creevey config.

## Write tests

By default Creevey generate for each story very simple screenshot test. In most cases it would be enough to test your UI. But you may want to do some interactions and capture one or multiple screenshots with different states of your story. For this case you could write custom tests, like this

```tsx
import React from 'react';
import { Story } from '@storybook/react';
import { CreeveyStory } from 'creevey';
import MyComponent from './src/components/MyComponent';

export default { title: 'MyComponent' };

export const Basic: Story & CreeveyStory = () => <MyComponent />;
Basic.parameters = {
  creevey: {
    captureElement: '#root',
    tests: {
      async click() {
        await this.browser.actions().click(this.captureElement).perform();

        await this.expect(await this.takeScreenshot()).to.matchImage('clicked component');
      },
    },
  },
};
```

NOTE: Here you define story parameters with simple test `click`. Where you setup capturing element `#root` then click on that element and taking screenshot to assert it. `this.browser` allow you to access to native selenium webdriver instance you could check [API here](https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html).

You also could write more powerful tests with asserting multiple screenshots

```tsx
import React from 'react';
import { CSFStory } from 'creevey';
import MyForm from './src/components/MyForm';

export default { title: 'MyForm' };

export const Basic: CSFStory<JSX.Element> = () => <MyForm />;
Basic.story = {
  parameters: {
    creevey: {
      captureElement: '#root',
      delay: 1000,
      tests: {
        async submit() {
          const input = await this.browser.findElement({ css: '.my-input' });

          const empty = await this.takeScreenshot();

          await this.browser.actions().click(input).sendKeys('Hello Creevey').sendKeys(this.keys.ENTER).perform();

          const submitted = await this.takeScreenshot();

          await this.expect({ empty, submitted }).to.matchImages();
        },
      },
    },
  },
};
```

NOTE: In this example I fill some simple form and submit it. Also as you could see, I taking two different screenshots `empty` and `submitted` and assert these in the end.

## Creevey under the hood

Creevey built on top of [mocha](https://mochajs.org/)+[chai](https://www.chaijs.com/), [pixelmatch](https://github.com/mapbox/pixelmatch) and [selenium](https://www.npmjs.com/package/selenium-webdriver) tools.

All screenshot tests are running in nodejs environment, so Creevey should load stories source code into nodejs. And to achieve this Creevey load webpack config that storybook use to build bundle. Then Creevey tweak that config and add special webpack-loader to cutoff all non-story things and leave only story metadata and tests. This allow Creevey to support any framework or project configuration, that supported by storybook itself. After storybook bundle built, Creevey subscribe to storybook channel events and require bundle. Stories are loaded by storybook and all metadata emitted in `setStories` event. That metadata used to generate tests.

Multiple process configuration used to run each browser instance in separate nodejs worker process. Master process manage workers pool, handle ui web server. One of workers process used to build webpack bundle.

## Future plans

- Allow use different webdrivers not only `selenium`, but also `puppeteer` or `playwright`.
- Add ability to ignore elements.
- Allow to define different viewport sizes for specific stories or capture story with different args.

## Known issues

### Chrome webdriver + 1px border with border-radius.

This cause to flaky screenshots. Possible solutions:

- Increase threshold ratio in Creevey config `diffOptions: { threshold: 0.1 }`
- Replace border to box-shadow `border: 1px solid red` -> `box-shadow: 0 0 0 1px red`
- Set max retries to more than 5

### Docker-in-Docker

Currently it's not possible to run Creevey in this configuration. I'll fix this in later versions.
If you use `CircleCI` or another CI that use docker to run jobs. Try to configure to use virtual machine executor

### You can't directly import `selenium-webdriver` package in story file

Because tests defined in story parameters and `selenium-webdriver` depends on nodejs builtin packages. Storybook may fail to build browser bundle. To avoid import use these workarounds:

- `.findElement(By.css('#root'))` -> `.findElement({ css: '#root' })`
- `.sendKeys(Keys.ENTER)` -> `.sendKeys(this.keys.ENTER)`

## Used by

| [![Whisk](https://raw.githubusercontent.com/wKich/creevey/master/.github/images/whisk.svg)](https://whisk.com/) | [![SKB Kontur](https://kontur.ru/Files/userfiles/image/brandbook/logo-skb-kontur-eng.png)](https://kontur.ru/) | [![ABBYY](https://raw.githubusercontent.com/wKich/creevey/master/.github/images/abbyy.svg)](https://www.abbyy.com/) |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
