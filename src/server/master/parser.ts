import { createHash } from "crypto";
import { Test } from "../../types";
import { defaultConfig } from "../../config";
import { Loader } from "../../loader";

const tests: Partial<{ [id: string]: Test }> = {};
const preprocessors = JSON.parse(process.env.preprocessors || "[]");
const testDir = process.env.testDir || defaultConfig.testDir;
const testRegex = process.env.testRegex || defaultConfig.testRegex;
const browsers: string[] = JSON.parse(process.env.browsers || "[]");
let suites: string[] = [];

function describe(title: string, describeFn: () => void) {
  suites = [title, ...suites];
  describeFn();
  [, ...suites] = suites;
}

function it(title: string): Test[] {
  return browsers
    .map(browser => [browser, title, ...suites])
    .map(testPath => ({
      id: createHash("sha1")
        .update(testPath.join("/"))
        .digest("hex"),
      path: testPath,
      retries: 0
    }))
    .map(test => (tests[test.id] = test));
}

it.skip = function skip(browsers: string[], title: string) {
  it(title)
    .filter(({ path: [browser] }) => browsers.includes(browser))
    .forEach(test => (test.skip = true));
};

// @ts-ignore
global.describe = describe;
// @ts-ignore
global.it = it;

(async () => {
  await new Loader({ preprocessors, testRegex }, require).loadTests(testDir);

  if (process.send) {
    process.send(JSON.stringify(tests));
  } else {
    console.log(JSON.stringify(tests));
  }
})();
