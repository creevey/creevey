# creevey

Visual testing with magic

## How to use

### Mocha UI

- Define config `creevey.js`

```js
const path = require("path");

module.exports = {
  gridUrl: "<gridUrl>/wd/hub",
  address: {
    host: "localhost",
    port: 6060,
    path: "/iframe.html"
  },
  testRegex: /\.ts$/,
  testDir: path.join(__dirname, "tests"),
  screenDir: path.join(__dirname, "images"),
  reportDir: path.join(__dirname, "report"),
  maxRetries: 2,
  browsers: {
    chrome: { browserName: "chrome" },
    firefox: { browserName: "firefox" },
    ie11: {
      browserName: "internet explorer",
      gridUrl: "<gridUrl>/wd/hub",
      limit: 2
      /* capabilities */
    },
    chromeFlat: {
      browserName: "chrome",
      testRegex: /(Button|Input).ts$/,
      address: {
        host: "localhost",
        port: 6061,
        path: "/iframe.html"
      }
    }
  }
};
```

- Define mocha.opts

```
--require creevey/lib/mocha-ui
--ui creevey
./tests/*
```

- Run tests `yarn mocha --opts ./mocha.opts`

### Creevey CLI

- Define config `creevey.js`
- To allow use `typescript`:
  - Add first line to config file `require("ts-node").register({ files: true, transpileOnly: true });`
  - Define in config `testRegex: /\.ts$/,`
- Run test server `yarn creevey --ui`
- Open webpage `http://localhost:3000/`
- Or run tests without starting server `yarn creevey`

### Requirements

- Add code below to your storybook config

```ts
import React from "react";
import ReactDOM from "react-dom";
import { storiesOf, getStorybook } from "@storybook/react";

let stories = null;

function renderStory({ kind, story }) {
  const root = document.getElementById("root");

  ReactDOM.unmountComponentAtNode(root);
  ReactDOM.render(stories[kind][story](), root);
}

storiesOf("All", module).add("Stories", () => {
  if (!stories) {
    stories = {};
    getStorybook().forEach(kind => {
      stories[kind.kind] = {};
      kind.stories.forEach(story => {
        stories[kind.kind][story.name] = story.render;
      });
    });
  }
  window.renderStory = renderStory;
  window.getStorybook = getStorybook;
  return <div />;
});
```
