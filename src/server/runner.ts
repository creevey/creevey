import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import uuid from "uuid";
import { Config, Workers, Test } from "../types";
import Pool from "./pool";

export default class Runner extends EventEmitter {
  private tests: { [id: string]: Test } = {};
  private pools: Pool[];
  constructor(config: Config) {
    super();

    this.pools = Object.keys(config.browsers).map(browser => {
      const pool = new Pool(config, browser);

      // TODO maybe types
      pool.on("message", this.emit.bind(this, "message"));

      return pool;
    });
    this.loadTests(config.testDir);
  }

  loadTests(testDir: string) {
    const tests = this.tests;
    let suites: string[] = [];

    function describe(title: string, describeFn: () => void) {
      suites = [title, ...suites];
      describeFn();
      [, ...suites] = suites;
    }

    function it(title: string) {
      const test: Test = { suites, title };

      tests[uuid.v4()] = test;

      return test;
    }

    it.skip = function skip(browsers: string[], title: string) {
      it(title).skip = browsers;
    };

    // @ts-ignore
    global.describe = describe;
    // @ts-ignore
    global.it = it;

    fs.readdirSync(testDir).forEach(function(file) {
      require(path.join(testDir, file));
    });
  }

  start(ids: string[]) {
    // TODO send runner status

    return Promise.all(this.pools.map(pool => pool.startTests(ids.map(id => this.tests[id]))));
  }

  stop() {
    // TODO send runner status

    this.pools.forEach(pool => pool.stop());
  }

  getTests() {
    return this.tests;
  }
}

function startTests(tests: Tests, workers: Workers) {
  const flattenTests: { [browser: string]: Array<{ kind: string; story: string; test: string }> } = {};
  const browsers = Object.keys(workers);
  const workerPromises: Promise<void>[] = [];

  browsers.forEach(browser => (flattenTests[browser] = []));

  Object.entries(tests).forEach(([kind, kindTests]) =>
    Object.entries(kindTests).forEach(([story, storyTests]) =>
      storyTests.forEach(({ test, skip = [] }) =>
        browsers
          .filter(browser => skip.includes(browser))
          .forEach(browser => flattenTests[browser].push({ kind, story, test }))
      )
    )
  );

  browsers.forEach(browser => {
    workers[browser].forEach(worker => {
      workerPromises.push(
        new Promise(resolve => {
          function runTest() {
            const test = flattenTests[browser].shift();
            if (!test) {
              resolve();
            }
            worker.send(JSON.stringify({ type: "runTest", payload: test }));
          }
          worker.on("message", (message: string) => {
            const event = JSON.parse(message);

            // TODO send event
            // sucess, failed
            console.log(event);

            runTest();
          });

          runTest();
        })
      );
    });
  });

  return Promise.all(workerPromises);
}
