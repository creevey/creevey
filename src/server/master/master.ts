import path from 'path';
import { Config, TestData, isDefined, ServerTest } from '../../types';
import Runner from './runner';
import { shutdownWorkers } from '../utils';
import { storiesProviderFactory } from '../storiesProviders/storiesProviderFactory';

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

export default async function master(config: Config, watch: boolean): Promise<Runner> {
  const runner = new Runner(config);
  const reportDataPath = path.join(config.reportDir, 'data.js');
  let testsFromReport = {};
  try {
    testsFromReport = (await import(reportDataPath)) as Partial<{ [id: string]: TestData }>;
  } catch (error) {
    // Ignore error
  }

  const provider = storiesProviderFactory({ config });
  await provider.init();

  const tests = await provider.loadTestsFromStories({ browsers: Object.keys(config.browsers), watch }, (testsDiff) =>
    runner.updateTests(testsDiff),
  );

  runner.tests = mergeTests(testsFromReport, tests);

  process.on('SIGINT', () => {
    if (runner.isRunning) {
      // TODO Better handle stop
      void Promise.race([
        new Promise((resolve) => setTimeout(resolve, 10000)),
        new Promise((resolve) => runner.once('stop', resolve)),
      ])
        .then(() => shutdownWorkers())
        // eslint-disable-next-line no-process-exit
        .then(() => process.exit());
      runner.stop();
    } else {
      // eslint-disable-next-line no-process-exit
      void shutdownWorkers().then(() => process.exit());
    }
  });

  await runner.init();

  return runner;
}
