import { Suite, Context, Test } from 'mocha';
import { StoriesRaw, isDefined } from '../../types';
import { convertStories } from '../../stories';

function findOrCreateSuite(name: string, parent: Suite): Suite {
  const suite = parent.suites.find(({ title }) => title == name) || new Suite(name, parent.ctx);
  if (!suite.parent) {
    suite.parent = parent;
    parent.addSuite(suite);
  }
  return suite;
}

function createTest(name: string, fn: (this: Context) => Promise<void>, skip: string | boolean): Test {
  const test = new Test(name, skip ? undefined : fn);
  test.pending = Boolean(skip);
  // NOTE Can't define skip reason in mocha https://github.com/mochajs/mocha/issues/2026
  test.skipReason = skip;
  return test;
}

export function addTestsFromStories(rootSuite: Suite, browserName: string, stories: StoriesRaw): void {
  Object.values(convertStories([browserName], stories))
    .filter(isDefined)
    .forEach(test => {
      const [, testName, ...suitePath] = test.path;
      const suite = suitePath.reduceRight((subSuite, suiteName) => findOrCreateSuite(suiteName, subSuite), rootSuite);
      suite.addTest(createTest(testName, test.fn, test.skip));
    });
}
