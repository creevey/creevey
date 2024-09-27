/// <reference types="mocha" />
declare namespace Mocha {
  interface Context {
    config: import('creevey').Config;
    browser: import('selenium-webdriver').WebDriver;
    until: import('selenium-webdriver/lib/until');
    keys: import('selenium-webdriver/lib/input').IKey;
    expect: Chai.ExpectStatic;
    takeScreenshot: () => Promise<string>;
    updateStoryArgs: (updatedArgs: Record<string, unknown>) => Promise<void>;
    readonly captureElement?: import('selenium-webdriver').WebElementPromise;
    browserName: string;
    testScope: string[];
    screenshots: { imageName?: string; screenshot: string }[];
  }

  interface Test {
    skipReason: string | boolean;
  }
}
