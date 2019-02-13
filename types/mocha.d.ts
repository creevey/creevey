import { WebDriver } from "selenium-webdriver";

declare module "mocha" {
  // NOTE @types/mocha don't have `retries` method in MochaGlobals
  export interface MochaGlobals {
    retries: (n: number) => MochaGlobals;
  }

  export interface Context {
    browser: WebDriver;
    browserName: string;
    kind: string;
    story: string;
  }

  export interface SuiteFunction {
    (title: string, fn: (this: Suite) => void): Suite | Suite[];
    only: ExclusiveSuiteFunction;
    skip: PendingSuiteFunction;
  }

  export interface ExclusiveSuiteFunction {
    (browsers: string[], title: string, fn: (this: Suite) => void): Suite | Suite[];
  }

  export interface PendingSuiteFunction {
    (browsers: string[], title: string, fn: (this: Suite) => void): Suite | Suite[];
  }

  export interface TestFunction {
    only: ExclusiveTestFunction;
    skip: PendingTestFunction;
  }

  export interface ExclusiveTestFunction {
    (browsers: string[], title: string, fn?: AsyncFunc): Test;
  }

  export interface PendingTestFunction {
    (browsers: string[], title: string, fn?: AsyncFunc): Test;
  }
}
