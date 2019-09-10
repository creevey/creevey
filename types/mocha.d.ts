declare namespace Mocha {
  interface Context {
    config: import("creevey").Config;
    browser: import("selenium-webdriver").WebDriver;
    browserName: string;
    testScope: string[];
  }
}
