import path from 'path';
import { Config, TestData, isDefined, ServerTest } from '../../types.js';
import { loadTestsFromStories, saveTestsJson } from '../stories.js';
import Runner from './runner.js';
import { tryToLoadTestsData } from '../utils.js';

function mergeTests(
  testsWithReports: Partial<Record<string, TestData>>,
  testsFromStories: Partial<Record<string, ServerTest>>,
): Partial<Record<string, ServerTest>> {
  Object.values(testsFromStories)
    .filter(isDefined)
    .forEach((test) => {
      const testWithReport = testsWithReports[test.id];
      if (!testWithReport) return;
      test.retries = testWithReport.retries;
      if (testWithReport.status == 'success' || testWithReport.status == 'failed') test.status = testWithReport.status;
      test.results = testWithReport.results;
      test.approved = testWithReport.approved;
    });
  return testsFromStories;
}

export default async function master(config: Config): Promise<Runner> {
  const runner = new Runner(config);
  const reportDataPath = path.join(config.reportDir, 'data.js');
  const testsFromReport = tryToLoadTestsData(reportDataPath) ?? {};

  await runner.init();

  const tests = await loadTestsFromStories(
    Object.keys(config.browsers),
    (listener) => config.storiesProvider(config, listener),
    (testsDiff) => {
      runner.updateTests(testsDiff);
      saveTestsJson(runner.tests, config.reportDir);
    },
  );

  runner.tests = mergeTests(testsFromReport, tests);
  saveTestsJson(runner.tests, config.reportDir);

  return runner;
}
