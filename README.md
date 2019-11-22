# creevey

Pretty easy visual testing with magic

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## How to use

- `npm install -D creevey`
- Add `withCreevey` as top-level storybook decorator
- Run tests `yarn creevey --gridUrl "<gridUrl>/wd/hub"`

## What's storybook decorator?

[Using Decorators](https://storybook.js.org/docs/basics/writing-stories/#using-decorators)

```ts
// .storybook/config.js
import { addDecorator } from '@storybook/react';
import { withCreevey } from 'creevey';

addDecorator(withCreevey());

/* ... */
```

## Also you can define `creevey.config.ts`

```ts
import path from 'path';
import { CreeveyConfig } from 'creevey';

const config: CreeveyConfig = {
  gridUrl: '<gridUrl>/wd/hub',
  storybookUrl: 'http://localhost:6006',
  screenDir: path.join(__dirname, 'images'),
  reportDir: path.join(__dirname, 'report'),
  threshold: 0.1,
  maxRetries: 2,
  browsers: {
    chrome: true,
    ff: 'firefox',
    ie11: {
      browserName: 'internet explorer',
      gridUrl: '<gridUrl>/wd/hub',
      limit: 2,
      /* capabilities */
    },
    otherChrome: {
      browserName: 'chrome',
      storybookUrl: 'http://mystoryhost:6007',
      viewport: { width: 1024, height: 720 },
    },
  },
};

export default config;
```

## Creevey CLI options

- `--config` — Specify path to config file. Default `./creevey.config`
- `--reporter` — Use another reporter for mocha instead of default `spec`
- `--gridUrl` — Specify selenium grid url, work only in zero-config
- `--ui` — Start web server
- `--update` — Approve all images from `report` directory
- `--port` — Specify port for web server. Default `3000`

## `withCreevey` decorator parameters

You can specify storybook parameters for `withCreevey` decorator:

```tsx
// Global parameters can be defined in storybook config
addDecorator(withCreevey({
  captureElement: '#root',
  skip: /* see examples below */,
  tests: /* TODO */
}));

// For new `Component Story Format` (CSF) https://storybook.js.org/docs/formats/component-story-format/
// Kind-level parameters work for all stories inside
export default {
  title: "Views",
  parameters: {
    creevey: { /* ... */ }
  }
};

// Story-level parameters work only for that story
export const simple = () => <MyComponent />;
simple.story = {
  parameters: {
    creevey: { /* ... */ }
  }
};

// For Old `StoriesOf` API (Storybook version < 5.2)
storiesOf('Views', module)
  .addParameters({ creevey: { /* ... */ } }) // Kind-level
  .add('simple', () => <MyComponent />, { creevey: { /* ... */ } }); // Story-level

// For Storybook version < 4.0 you can use global parameters only
```

NOTE: Parameters for story will be merged with parameters from higher levels

## `skip` option examples:

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
- Skip specific stories for all browsers:
  - `skip: { stories: 'simple' }`
  - `skip: { stories: ['simple', 'special'] }`
  - `skip: { stories: /.*large$/ }`
- Multiple skip options: `skip: [{ /* ... */ }]`

## FAQ

### Get error `Cannot find module '/path/to/project/creevey.config'` with CRA

CRA don't have `@babel/register` or `ts-node` in deps, that used to load TypeScript modules in runtime. So you need to install one of those packages explicitly
