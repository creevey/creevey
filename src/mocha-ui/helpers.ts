import chai from "chai";
import { Suite, AsyncFunc, Test, TestFunction, SuiteFunction } from "mocha";
import commonInterface, { CommonFunctions, CreateOptions } from "mocha/lib/interfaces/common";

import chaiImage from "./chai-image";
import { getBrowser, switchStory } from "./browser";
import { Config } from "../types";

type CreateSuite = (options: CreateOptions, parentSuite: Suite) => Suite;
type Describer = (title: string, fn: (this: Suite) => void, createSuite: CreateSuite) => Suite | Suite[];

export function createBrowserSuites(config: Config, suites: Suite[]) {
  // @ts-ignore `context` and `mocha` args not used here
  const commonGlobal = commonInterface(suites);

  return Object.entries(config.browsers).map(([browserName, capabilities]) => {
    const browserSuite = commonGlobal.suite.create({
      title: browserName,
      file: "",
      fn: () => null
    });

    browserSuite.ctx.browserName = browserName;

    browserSuite.beforeAll(async () => {
      browserSuite.ctx.browser = await getBrowser(config, capabilities); // <===== custom function get it from config, to allow redefine
    });

    return browserSuite;
  });
}

export function createDescriber(config: Config, browserSuites: Suite[], suites: Suite[], file: string): Describer {
  const testContext: string[] = [];

  chai.use(chaiImage(config, testContext));

  return function describer(title: string, fn: (this: Suite) => void, createSuite: CreateSuite): Suite | Suite[] {
    const [parentSuite] = suites;

    if (parentSuite.root) {
      return browserSuites.map(browserSuite => {
        suites.unshift(browserSuite);

        const kindSuite = createSuite({ title, fn, file }, browserSuite);

        suites.shift();

        return kindSuite;
      });
    }

    const storySuite = createSuite({ title, fn, file }, parentSuite);

    storySuite.beforeEach(async function() {
      await switchStory.call(this, testContext); // <====== custom function get it from config to allow redefine. Check suite level and beforeEach
    });

    return storySuite;
  };
}

export function describeFactory(describer: Describer, common: CommonFunctions): SuiteFunction {
  function describe(title: string, fn: (this: Suite) => void) {
    return describer(title, fn, options => common.suite.create(options));
  }

  function only(browsers: string[], title: string, fn: (this: Suite) => void): Suite | Suite[] {
    return describer(title, fn, (options, parentSuite) =>
      browsers.includes(parentSuite.ctx.browserName) ? common.suite.only(options) : common.suite.create(options)
    );
  }

  function skip(browsers: string[], title: string, fn: (this: Suite) => void): Suite | Suite[] {
    return describer(title, fn, (options, parentSuite) =>
      browsers.includes(parentSuite.ctx.browserName) ? common.suite.skip(options) : common.suite.create(options)
    );
  }

  describe.only = only;
  describe.skip = skip;

  // NOTE We can't redefine interface, only extend it
  return describe as SuiteFunction;
}

export function itFactory(suites: Suite[], file: string, common: CommonFunctions): TestFunction {
  // NOTE copy-paste from bdd-interface
  function it(title: string, fn?: AsyncFunc): Test {
    const [parentSuite] = suites;
    if (parentSuite.isPending()) {
      fn = undefined;
    }
    const test = new Test(title, fn);
    test.file = file;
    parentSuite.addTest(test);
    return test;
  }

  function only(browsers: string[], title: string, fn?: AsyncFunc): Test {
    const [parentSuite] = suites;

    return browsers.includes(parentSuite.ctx.browserName) ? common.test.only(mocha, it(title, fn)) : it(title, fn);
  }

  function skip(browsers: string[], title: string, fn?: AsyncFunc): Test {
    const [parentSuite] = suites;

    return browsers.includes(parentSuite.ctx.browserName) ? it(title) : it(title, fn);
  }
  function retries(n: number): void {
    common.test.retries(n);
  }

  it.only = only;
  it.skip = skip;
  it.retries = retries;

  // NOTE We can't redefine interface, only extend it
  return it as TestFunction;
}
