/// <reference types="mocha" />
declare namespace Mocha {
  interface Context {
    config: import('creevey').Config;
    browser: import('selenium-webdriver').WebDriver;
    keys: import('selenium-webdriver/lib/input').IKey;
    expect: Chai.ExpectStatic;
    takeScreenshot: () => Promise<string>;
    readonly captureElement?: import('selenium-webdriver').WebElementPromise;
    browserName: string;
    testScope: string[];
  }

  interface Test {
    skipReason: string | boolean;
  }
}
