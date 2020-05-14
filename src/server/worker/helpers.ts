import { Suite, Context, Test } from 'mocha';
import { isDefined, ServerTest } from '../../types';
import { loadTestsFromStories } from '../../stories';

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

function addTest(rootSuite: Suite, test: ServerTest): Test {
  const [, testName, ...suitePath] = test.path;
  const suite = suitePath.reduceRight((subSuite, suiteName) => findOrCreateSuite(suiteName, subSuite), rootSuite);
  const mochaTest = createTest(testName, test.fn, test.skip);
  suite.addTest(mochaTest);
  mochaTest.ctx = Object.setPrototypeOf({ id: test.id, story: test.story }, suite.ctx);
  return mochaTest;
}

function removeTestOrSuite(testOrSuite: Test | Suite): void {
  const { parent } = testOrSuite;
  if (!parent) return;
  if (testOrSuite instanceof Test) parent.tests = parent.tests.filter((test) => test != testOrSuite);
  if (testOrSuite instanceof Suite) parent.suites = parent.suites.filter((suite) => suite != testOrSuite);
  if (parent.tests.length == 0 && parent.suites.length == 0) removeTestOrSuite(parent);
}

export async function addTestsFromStories(
  rootSuite: Suite,
  browserName: string,
  storybookBundlePath: string,
): Promise<void> {
  const mochaTestsById: Map<string, Test> = new Map();
  const tests = await loadTestsFromStories({ browsers: [browserName], storybookBundlePath }, (testsDiff) =>
    Object.entries(testsDiff).forEach(([id, newTest]) => {
      const oldTest = mochaTestsById.get(id);
      mochaTestsById.delete(id);
      if (oldTest) removeTestOrSuite(oldTest);
      if (newTest) mochaTestsById.set(id, addTest(rootSuite, newTest));
    }),
  );

  Object.values(tests)
    .filter(isDefined)
    .forEach((test) => mochaTestsById.set(test.id, addTest(rootSuite, test)));
}
