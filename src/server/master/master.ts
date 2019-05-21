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

function loadTests() {
  return new Promise(resolve => {
    console.log("[CreeveyRunner]:", "Start loading tests");
    cluster.setupMaster({ args: ["--parser"] });
    const parser = cluster.fork();
    parser.once("message", message => {
      const tests: Partial<{ [id: string]: Test }> = JSON.parse(message);
      console.log("[CreeveyRunner]:", "Tests loaded");
      resolve(tests);
    });
  });
}

function mergeTests(tests: Partial<{ [id: string]: Test }>, testsWithReports: Partial<{ [id: string]: Test }>) {
  const mergedTests: Partial<{ [id: string]: Test }> = {};
  Object.values(tests)
    .filter(isDefined)
    .forEach(
      test =>
        (mergedTests[test.id] = {
          ...test,
          ...(testsWithReports[test.id] || {})
        })
    );

  return mergedTests;
}

async function copyStatics(reportDir: string) {
  const clientDir = path.join(__dirname, "../../client");
  const files = (await readdirAsync(clientDir, { withFileTypes: true }))
    .filter(dirent => !/\.d\.ts$/.test(dirent.name))
    .map(dirent => dirent.name);
  await mkdirpAsync(reportDir);
  for (const file of files) {
    await copyFileAsync(path.join(clientDir, file), path.join(reportDir, file));
  }
}

export default async function master(config: Config) {
  const reportDataPath = path.join(config.reportDir, "data.js");
  let testsWithReports = {};
  try {
    testsWithReports = require(reportDataPath);
  } catch (error) {
    // Ignore error
  }
  const tests = await loadTests();
  const mergedTests = mergeTests(tests, testsWithReports);

  const runner = new Runner(config, mergedTests);

  await runner.init();
  await copyStatics(config.reportDir);

  process.on("SIGINT", () => {
    if (runner.isRunning) {
      runner.once("stop", () => process.exit(0));
      runner.stop();
    } else {
      process.exit(0);
    }
  });
  process.on("exit", () => writeFileSync(reportDataPath, reportDataModule(runner.status.testsById)));

  return runner;
}
