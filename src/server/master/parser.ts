import { createHash } from "crypto";
import { Test, Config } from "../../types";
import { Loader } from "../../loader";

export default async function parse(config: Config) {
  const tests: Partial<{ [id: string]: Test }> = {};
  let suites: string[] = [];
  let testFilePath = "";

  function describe(title: string, describeFn: () => void) {
    suites = [title, ...suites];
    describeFn();
    [, ...suites] = suites;
  }

  function it(title: string): Test[] {
    return Object.keys(config.browsers)
      .map(browser => ({
        testPath: [browser, title, ...suites],
        config: config.browsers[browser]
      }))
      .map(({ testPath, config }) => ({
        id: createHash("sha1")
          .update(testPath.join("/"))
          .digest("hex"),
        path: testPath,
        retries: 0,
        skip: Boolean(config.testRegex && !config.testRegex.test(testFilePath))
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

  await new Loader(config.testRegex, filePath => {
    testFilePath = filePath;
    require(filePath);
  }).loadTests(config.testDir);

  if (process.send) {
    process.send(JSON.stringify(tests));
  } else {
    console.log(JSON.stringify(tests));
  }
}
