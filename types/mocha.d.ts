/// <reference types="mocha" />
declare namespace Mocha {
  interface Context {
    config: import('creevey').Config;
    browser: import('selenium-webdriver').WebDriver;
    keys: import('selenium-webdriver/lib/input').IKey;
    expect: Chai.ExpectStatic;
    takeScreenshot:
      | import('selenium-webdriver').WebDriver['takeScreenshot']
      | import('selenium-webdriver').WebElement['takeScreenshot'];
    readonly captureElement?: import('selenium-webdriver').WebElementPromise;
    browserName: string;
    testScope: string[];
  }

  interface Test {
    skipReason: string | boolean;
  }
}
