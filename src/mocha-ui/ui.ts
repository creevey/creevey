import Mocha, { Suite } from "mocha";
import commonInterface from "mocha/lib/interfaces/common";

import { createBrowserSuites, createDescriber, describeFactory, itFactory } from "./helpers";
import { readConfig } from "../utils";

const config = readConfig();

// @ts-ignore
Mocha.interfaces.creevey = function creevey(suite: Suite) {
  const suites = [suite];
  const browserSuites = createBrowserSuites(config, suites);

  suite.on("pre-require", function preRequire(context, file, mocha) {
    const common = commonInterface(suites, context, mocha);

    const describer = createDescriber(config, browserSuites, suites, file);
    const describe = describeFactory(describer, common);
    const it = itFactory(suites, file, common);

    context.before = common.before;
    context.after = common.after;
    context.beforeEach = common.beforeEach;
    context.afterEach = common.afterEach;
    context.run = mocha.options.delay ? common.runWithSuite(suite) : () => null;

    context.describe = context.context = describe;
    context.xdescribe = context.xcontext = context.describe.skip;

    context.it = context.specify = it;
    context.xit = context.xspecify = context.it.skip;
  });
};
