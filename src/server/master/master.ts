import path from 'path';
import cluster from 'cluster';
import { writeFileSync, copyFile, readdir, mkdir } from 'fs';
import { promisify } from 'util';
import { Config, Test, isDefined, ServerTest } from '../../types';
import { loadTestsFromStories } from '../../stories';
import Runner from './runner';

const copyFileAsync = promisify(copyFile);
const readdirAsync = promisify(readdir);
const mkdirAsync = promisify(mkdir);

function reportDataModule<T>(data: T): string {
  return `
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.__CREEVEY_DATA__ = factory();
  }
}(this, function () { return ${JSON.stringify(data)} }));
`;
}

function mergeTests(
  testsWithReports: Partial<{ [id: string]: Test }>,
  testsFromStories: Partial<{ [id: string]: ServerTest }>,
): Partial<{ [id: string]: ServerTest }> {
  Object.values(testsFromStories)
    .filter(isDefined)
    .forEach(test => {
      const testWithReport = testsWithReports[test.id];
      if (!testWithReport) return;
      test.retries = testWithReport.retries;
      if (testWithReport.status == 'success' || testWithReport.status == 'failed') test.status = testWithReport.status;
      test.results = testWithReport.results;
      test.approved = testWithReport.approved;
    });
  return testsFromStories;
}

async function copyStatics(reportDir: string): Promise<void> {
  const clientDir = path.join(__dirname, '../../client');
  const files = (await readdirAsync(clientDir, { withFileTypes: true }))
    .filter(dirent => dirent.isFile() && !dirent.name.endsWith('.d.ts'))
    .map(dirent => dirent.name);
  await mkdirAsync(reportDir, { recursive: true });
  for (const file of files) {
    await copyFileAsync(path.join(clientDir, file), path.join(reportDir, file));
  }
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
  const tests = await loadTestsFromStories(config, Object.keys(config.browsers), testsDiff =>
    runner.updateTests(testsDiff),
  );

  runner.updateTests(mergeTests(testsFromReport, tests));

  await runner.init();
  await copyStatics(config.reportDir);

  process.on('SIGINT', () => {
    if (runner.isRunning) {
      // TODO Better handle stop
      Promise.race([
        new Promise(resolve => setTimeout(resolve, 10000)),
        new Promise(resolve => runner.once('stop', resolve)),
      ]).then(() => cluster.disconnect(() => process.exit(0)));
      runner.stop();
    } else {
      cluster.disconnect(() => process.exit(0));
    }
  });
  process.on('exit', () => writeFileSync(reportDataPath, reportDataModule(runner.status.tests)));

  return runner;
}
