# creevey

Visual testing with magic

## How to use

- Define config `creevey.js`

```js
import path from "path";

const config = {
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

export default config;
```

- Define mocha.opts

```
--require creevey/lib/mocha-ui
--ui creevey
./tests/*
```

- Run tests `mocha --opts ./mocha.opts`
