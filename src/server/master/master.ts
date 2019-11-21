import path from "path";
import { writeFileSync, copyFile, readdir } from "fs";
import { promisify } from "util";
import cluster from "cluster";
import mkdirp from "mkdirp";
import { Config, Test, isDefined } from "../../types";
import Runner from "./runner";

const copyFileAsync = promisify(copyFile);
const readdirAsync = promisify(readdir);
const mkdirpAsync = promisify(mkdirp);

function reportDataModule<T>(data: T) {
  return `
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.creeveyData = factory();
  }
}(this, function () { return ${JSON.stringify(data)} }));
`;
}

function loadTests(): Promise<Partial<{ [id: string]: Test }>> {
  return new Promise(resolve => {
    console.log("[CreeveyRunner]:", "Start loading tests");
    cluster.setupMaster({ args: ["--parser", ...process.argv.slice(2)] });
    const parser = cluster.fork();
    parser.once("message", message => {
      const tests: Partial<{ [id: string]: Test }> = JSON.parse(message);
      console.log("[CreeveyRunner]:", "Tests loaded");
      resolve(tests);
    });
  });
}

function mergeTests(
  tests: Partial<{ [id: string]: Test }>,
  testsWithReports: Partial<{ [id: string]: Test }>,
  testsFromStories: Partial<{ [id: string]: Test }>
) {
  return Object.values(testsWithReports)
    .map((test): Test | undefined => test && { ...test, skip: true })
    .concat(Object.values(testsFromStories), Object.values(tests))
    .filter(isDefined)
    .reduce(
      (mergedTests: Partial<{ [id: string]: Test }>, test): Partial<{ [id: string]: Test }> =>
        (mergedTests = {
          ...mergedTests,
          [test.id]: {
            ...(mergedTests[test.id] || {}),
            ...test
          }
        }),
      {}
    );
}

async function copyStatics(reportDir: string) {
  const clientDir = path.join(__dirname, "../../client");
  const files = (await readdirAsync(clientDir, { withFileTypes: true }))
    .filter(dirent => dirent.isFile() && !/\.d\.ts$/.test(dirent.name))
    .map(dirent => dirent.name);
  await mkdirpAsync(reportDir);
  for (const file of files) {
    await copyFileAsync(path.join(clientDir, file), path.join(reportDir, file));
  }
}

export default async function master(config: Config) {
  const reportDataPath = path.join(config.reportDir, "data.js");
  let testsFromReport = {};
  try {
    testsFromReport = require(reportDataPath);
  } catch (error) {
    // Ignore error
  }
  const tests = config.testDir ? await loadTests() : {};

  const runner = new Runner(config);

  const testsFromStories = await runner.init();
  const mergedTests = mergeTests(tests, testsFromReport, testsFromStories);
  runner.tests = mergedTests;

  await copyStatics(config.reportDir);

  process.on("SIGINT", () => {
    if (runner.isRunning) {
      // TODO Better handle stop
      setTimeout(() => process.exit(0), 10000);
      runner.once("stop", () => process.exit(0));
      runner.stop();
    } else {
      process.exit(0);
    }
  });
  process.on("exit", () => writeFileSync(reportDataPath, reportDataModule(runner.status.testsById)));

  return runner;
}
