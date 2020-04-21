import path from 'path';
import cluster from 'cluster';
import { Config, Test, isDefined, ServerTest } from '../../types';
import { loadTestsFromStories } from '../../stories';
import Runner from './runner';

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

export default async function master(config: Config): Promise<Runner> {
  const runner = new Runner(config, {});
  const reportDataPath = path.join(config.reportDir, 'data.js');
  let testsFromReport = {};
  try {
    testsFromReport = require(reportDataPath);
  } catch (error) {
    // Ignore error
  }
  const tests = await loadTestsFromStories(config, Object.keys(config.browsers), (testsDiff) =>
    runner.updateTests(testsDiff),
  );

  runner.updateTests(mergeTests(testsFromReport, tests));

  await runner.init();

  process.on('SIGINT', () => {
    if (runner.isRunning) {
      // TODO Better handle stop
      Promise.race([
        new Promise((resolve) => setTimeout(resolve, 10000)),
        new Promise((resolve) => runner.once('stop', resolve)),
      ]).then(() => cluster.disconnect(() => process.exit(0)));
      runner.stop();
    } else {
      cluster.disconnect(() => process.exit(0));
    }
  });

  return runner;
}
