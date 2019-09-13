# creevey

Pretty easy visual testing with magic

## How to use

- `npm install -D creevey`
- Add `withCreevey` as top-level storybook decorator
- Run tests `yarn creevey --gridUrl "<gridUrl>/wd/hub"`

## What's storybook decorator?

[Using Decorators](https://storybook.js.org/docs/basics/writing-stories/#using-decorators)

```ts
// .storybook/config.js
import { addDecorator } from "@storybook/react";
import { withCreevey } from "creevey";

addDecorator(withCreevey());

/* ... */
```

## Also you can define `creevey.config.ts`

```ts
import path from "path";
import { CreeveyConfig } from "creevey";

const config: CreeveyConfig = {
  gridUrl: "<gridUrl>/wd/hub",
  storybookUrl: "http://localhost:6006",
  testRegex: /\.ts$/,
  testDir: path.join(__dirname, "tests"),
  screenDir: path.join(__dirname, "images"),
  reportDir: path.join(__dirname, "report"),
  threshold: 0.1,
  maxRetries: 2,
  browsers: {
    chrome: true,
    ff: "firefox",
    ie11: {
      browserName: "internet explorer",
      gridUrl: "<gridUrl>/wd/hub",
      limit: 2
      /* capabilities */
    },
    otherChrome: {
      browserName: "chrome",
      testRegex: /(Button|Input).ts$/,
      storybookUrl: "http://mystoryhost:6007",
      viewport: { width: 1024, height: 720 }
    }
  }
};

export default config;
```
