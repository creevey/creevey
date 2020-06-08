# Creevey for Storybook

NOTE: This guide suggest that your project has been created by Vue-CLI `vue create` command and you don't have outdated dependencies

## Pre-requisite

1. Install `Storybook` by command `vue add storybook`
1. Add peer dependencies: `npm add -D babel-preset-vue`

## Setup

1. Install `Creevey`

```bash
npm add -D creevey@next
```

2. Add the following NPM script to your `package.json`:

```js
"scripts": {
  "creevey:ui": "creevey --ui"
}
```

3. Add this content from below into `preview.js` file inside `config/.storybook/` directory

```js
import { addDecorator, addParameters } from '@storybook/vue';
import { withCreevey } from 'creevey';

addParameters({ creevey: { captureElement: '#root' } });
addDecorator(withCreevey());
```

4. Create `creevey` config by adding `creevey.config.js` file in root directory

```js
const path = require('path');

module.exports = {
  gridUrl: 'http://localhost:4444/wd/hub',
  storybookUrl: 'http://localhost:6006',
  storybookDir: path.join(__dirname, 'config/storybook'),
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
```
