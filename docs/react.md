# Creevey for Storybook

NOTE: This guide suggest that your project has been created by `create-react-app` command and you don't have outdated dependencies

## Pre-requisite

1. Install `Storybook` by using [this guide](https://storybook.js.org/docs/guides/guide-react/)

## Setup

1. Install `Creevey`

```bash
npm install -D creevey
```

2. Add this content from below into `preview.js` file inside `.storybook` directory

```js
import { addDecorator, addParameters } from '@storybook/react';
import { withCreevey } from 'creevey';

addParameters({ creevey: { captureElement: '#root' } });
addDecorator(withCreevey());
```

3. Create `creevey` config by adding `creevey.config.js` file in root directory

```js
const config = {
  gridUrl: 'http://localhost:4444/wd/hub',
  storybookUrl: 'http://localhost:9009',
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
