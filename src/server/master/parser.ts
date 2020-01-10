import { createHash } from 'crypto';
import { Test, Config, BrowserConfig } from '../../types';

export default function parse(config: Config): void {
  const tests: Partial<{ [id: string]: Test }> = {};
  let suites: string[] = [];
  let testFilePath = '';

  function describe(title: string, describeFn: () => void): void {
    suites = [title, ...suites];
    describeFn();
    [, ...suites] = suites;
  }

  function it(title: string): Test[] {
    return Object.keys(config.browsers)
      .map(browser => ({
        testPath: [browser, title, ...suites],
        config: config.browsers[browser] as BrowserConfig,
      }))
      .map(({ testPath, config }) => ({
        id: createHash('sha1')
          .update(testPath.join('/'))
          .digest('hex'),
        path: testPath,
        retries: 0,
        skip: Boolean(config.testRegex && !config.testRegex.test(testFilePath)),
      }))
      .filter(({ skip }) => !skip)
      .map(test => (tests[test.id] = test));
  }

  it.skip = function skip(browsers: string[], title: string) {
    it(title)
      .filter(({ path: [browser] }) => browsers.includes(browser))
      .forEach(test => (test.skip = true));
  };

  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore
  global.describe = describe;
  // @ts-ignore
  global.it = it;
  /* eslint-enable @typescript-eslint/ban-ts-ignore */

  if (config.testDir) {
    require
      .context(config.testDir, true, config.testRegex)
      .keys()
      .forEach(filePath => require((testFilePath = filePath)));
  }

  if (process.send) {
    process.send(JSON.stringify(tests));
  } else {
    console.log(JSON.stringify(tests));
  }
}
