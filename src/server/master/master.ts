import path from 'path';
import { writeFileSync, copyFile, readdir } from 'fs';
import { promisify } from 'util';
import cluster from 'cluster';
import mkdirp from 'mkdirp';
import { Config, Test, isDefined, CreeveyStatus } from '../../types';
import { loadStories, convertStories } from '../../stories';
import Runner from './runner';

const copyFileAsync = promisify(copyFile);
const readdirAsync = promisify(readdir);
const mkdirpAsync = promisify(mkdirp);

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

function loadTests(): Promise<CreeveyStatus['tests']> {
  return new Promise(resolve => {
    console.log('[CreeveyRunner]:', 'Start loading tests');
    cluster.setupMaster({ args: ['--parser', ...process.argv.slice(2)] });
    const parser = cluster.fork();
    parser.once('message', message => {
      const tests: CreeveyStatus['tests'] = JSON.parse(message);
      console.log('[CreeveyRunner]:', 'Tests loaded');
      resolve(tests);
    });
  });
}

async function loadTestsFromStories(storybookDir: string, browsers: string[]): Promise<CreeveyStatus['tests']> {
  const tests = convertStories(browsers, await loadStories(storybookDir));
  Object.values(tests)
    .filter(isDefined)
    .forEach(test => Reflect.deleteProperty(test, 'fn'));
  return tests;
}

function mergeTests(
  tests: CreeveyStatus['tests'],
  testsWithReports: CreeveyStatus['tests'],
  testsFromStories: CreeveyStatus['tests'],
): CreeveyStatus['tests'] {
  return Object.values(testsWithReports)
    .map((test): Test | undefined => test && { ...test, skip: true })
    .concat(Object.values(testsFromStories), Object.values(tests))
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
  await mkdirpAsync(reportDir);
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
  const tests = config.testDir ? await loadTests() : {};
  const testsFromStories = await loadTestsFromStories(config.storybookDir, Object.keys(config.browsers));
  const mergedTests = mergeTests(tests, testsFromReport, testsFromStories);

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
