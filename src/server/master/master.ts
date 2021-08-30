import path from 'path';
import { Config, TestData, isDefined, ServerTest } from '../../types';
import { loadTestsFromStories, saveTestsJson } from '../stories';
import Runner from './runner';
import { startWebpackCompiler } from '../loaders/webpack/start';

function mergeTests(
  testsWithReports: Partial<{ [id: string]: TestData }>,
  testsFromStories: Partial<{ [id: string]: ServerTest }>,
): Partial<{ [id: string]: ServerTest }> {
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

export default async function master(config: Config, options: { watch: boolean; debug: boolean }): Promise<Runner> {
  if (config.useWebpackToExtractTests) await startWebpackCompiler();
  const runner = new Runner(config);
  const reportDataPath = path.join(config.reportDir, 'data.js');
  let testsFromReport = {};
  try {
    testsFromReport = (await import(reportDataPath)) as Partial<{ [id: string]: TestData }>;
  } catch (error) {
    // Ignore error
  }

  const tests = await loadTestsFromStories(
    Object.keys(config.browsers),
    (listener) => config.storiesProvider(config, options, listener),
    (testsDiff) => {
      runner.updateTests(testsDiff);
      saveTestsJson(runner.tests, config.reportDir);
    },
  );

  runner.tests = mergeTests(testsFromReport, tests);
  saveTestsJson(runner.tests, config.reportDir);

  return runner;
}
