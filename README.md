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
  testDir: path.join(__dirname, "tests"),
  screenDir: path.join(__dirname, "images"),
  reportDir: path.join(__dirname, "report"),
  maxRetries: 1,
  browsers: {
    chrome: { browserName: "chrome", limit: 1 },
    firefox: { browserName: "firefox", limit: 1 },
    ie11: { browserName: "internet explorer", limit: 1 }
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
- If you want to use `typescript`, add first line to config `require("ts-node").register({ files: true, transpileOnly: true });`
- Run test server `yarn creevey`

### Programmatic API

```ts
import creevey from "crevey/lib/server";
import { Config } from "creevey/lib/types";

const config: Config = {
  /* ... */
};

creveey(config);
```

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
