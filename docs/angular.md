# Creevey for Storybook

NOTE: This guide suggest that your project has been created by `ng new` command and you don't have outdated dependencies

## Pre-requisite

1. Install `Storybook` by using [this guide](https://storybook.js.org/docs/guides/guide-angular/)

## Setup

1. Install `Creevey`

```bash
npm install -D creevey
```

2. Add this content from below into `preview.js` file inside `.storybook` directory

```js
import { addDecorator, addParameters } from '@storybook/angular';
import { withCreevey } from 'creevey';

addParameters({ creevey: { captureElement: '#root' } });
addDecorator(withCreevey());
```

3. Create `.creevey` config directory inside project root

4. Add `tsconfig.json` file in `.creevey` directory

```json
{
  "extends": "../.storybook/tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "allowJs": true
  }
}
```

5. Create `creevey` config by adding `config.ts` file in `.creevey` directory

```js
import 'zone.js/dist/zone-node';
import { CreeveyConfig } from 'creevey';

const config: CreeveyConfig = {
  gridUrl: 'http://localhost:4444/wd/hub',
  storybookUrl: 'http://localhost:6006',
  enableFastStoriesLoading: true,
  browsers: {
    chrome: {
      browserName: 'chrome',
      viewport: { width: 1024, height: 720 },
    },
    firefox: {
      browserName: 'firefox',
      viewport: { width: 1024, height: 720 },
    },
  },
};

export default config;
```
