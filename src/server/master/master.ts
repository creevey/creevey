import path from 'path';
import { writeFileSync, copyFile, readdir, mkdir } from 'fs';
import { promisify } from 'util';
import { Config, Test, isDefined, CreeveyStatus, StoriesRaw } from '../../types';
import { loadStories, convertStories } from '../../stories';
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

function loadTestsFromStories(stories: StoriesRaw, browsers: string[]): CreeveyStatus['tests'] {
  const tests = convertStories(browsers, stories);
  Object.values(tests)
    .filter(isDefined)
    .forEach(test => Reflect.deleteProperty(test, 'fn'));
  return tests;
}

function mergeTests(
  testsWithReports: CreeveyStatus['tests'],
  testsFromStories: CreeveyStatus['tests'],
): CreeveyStatus['tests'] {
  return Object.values(testsWithReports)
    .map((test): Test | undefined => test && { ...test, skip: true })
    .concat(Object.values(testsFromStories))
    .filter(isDefined)
    .reduce(
      (mergedTests: CreeveyStatus['tests'], test): CreeveyStatus['tests'] =>
        (mergedTests = {
          ...mergedTests,
          [test.id]: {
            ...(mergedTests[test.id] || {}),
            ...test,
          },
        }),
      {},
    );
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
  const reportDataPath = path.join(config.reportDir, 'data.js');
  let testsFromReport = {};
  try {
    testsFromReport = require(reportDataPath);
  } catch (error) {
    // Ignore error
  }
  const stories = await loadStories(config.storybookDir, config.enableFastStoriesLoading);
  const testsFromStories = loadTestsFromStories(stories, Object.keys(config.browsers));
  const mergedTests = mergeTests(testsFromReport, testsFromStories);

  const runner = new Runner(config, mergedTests);

  await runner.init();
  await copyStatics(config.reportDir);

  process.on('SIGINT', () => {
    if (runner.isRunning) {
      // TODO Better handle stop
      setTimeout(() => process.exit(0), 10000);
      runner.once('stop', () => process.exit(0));
      runner.stop();
    } else {
      process.exit(0);
    }
  });
  process.on('exit', () => writeFileSync(reportDataPath, reportDataModule(runner.status.tests)));

  return runner;
}
