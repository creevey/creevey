import { Tests, Config } from "../types";

export default class Runner {
  tests: [];
  wss: WebSocket[];
  constructor(config: Config) {}

  subscribe(ws: WebSocket) {}

  load() {
    const tests: Tests = {};
    const suites: string[] = [];

    global.describe = function describe(title: string, describeFn: () => void) {
      suites.unshift(title);
      describeFn();
      suites.shift();
    };

    global.it = function it(title: string) {
      const [kind, story] = suites;
      tests[kind] = tests[kind] || {};
      const kindTests = tests[kind];
      kindTests[story] = kindTests[story] || {};
      const storyTests = kindTests[story];

      const test = { test: title };

      storyTests.push(test);

      return test;
    };

    global.it.skip = function skip(browsers: string[], title: string) {
      const test = it(title);

      test.skip = browsers;
    };

    fs.readdirSync(testDir).forEach(function(file) {
      require(path.join(testDir, file));
    });

    return tests;
  }

  start() {}

  stop() {}

  getTests() {}
}
