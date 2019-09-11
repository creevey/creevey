# creevey

Visual testing with magic

## How to use

- `npm install -D creevey`
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

- Add story decorator into your storybook config:

```js
import { withCreevey } from "creevey";

addDecorator(withCreevey());

const req = require.context("../components", true, /.stories.tsx?$/);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
```

- To allow use `typescript`:
  - Add first line to config file `require("ts-node").register({ files: true, transpileOnly: true });`
  - Define in config `testRegex: /\.ts$/,`
- Run test server `yarn creevey --ui`
- Open webpage `http://localhost:3000/`
- Or run tests without starting server `yarn creevey`
