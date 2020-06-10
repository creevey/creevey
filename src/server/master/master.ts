import path from 'path';
import { Config, Test, isDefined, ServerTest } from '../../types';
import { loadTestsFromStories } from '../../stories';
import Runner from './runner';
import { startWebpackCompiler } from './stories';
import { shutdownWorkers } from '../../utils';

function mergeTests(
  testsWithReports: Partial<{ [id: string]: Test }>,
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
  const storybookBundlePath = await startWebpackCompiler();
  const runner = new Runner(config, storybookBundlePath);
  const reportDataPath = path.join(config.reportDir, 'data.js');
  let testsFromReport = {};
  try {
    testsFromReport = (await import(reportDataPath)) as Partial<{ [id: string]: Test }>;
  } catch (error) {
    // Ignore error
  }

  const tests = await loadTestsFromStories(
    { browsers: Object.keys(config.browsers), storybookBundlePath, watch },
    (testsDiff) => runner.updateTests(testsDiff),
  );

  runner.updateTests(mergeTests(testsFromReport, tests));

  process.on('SIGINT', () => {
    if (runner.isRunning) {
      // TODO Better handle stop
      void Promise.race([
        new Promise((resolve) => setTimeout(resolve, 10000)),
        new Promise((resolve) => runner.once('stop', resolve)),
      ]).then(() => {
        shutdownWorkers();
      });
      runner.stop();
    } else {
      shutdownWorkers();
    }
  });

  await runner.init();

  return runner;
}
