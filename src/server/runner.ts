import fs from "fs";
import path from "path";
import uuid from "uuid";
import WebSocket from "ws";
import { Config, Workers, Test } from "../types";

export default class Runner {
  private tests: { [id: string]: Test } = {};
  private wss: WebSocket[] = [];
  private workers: Workers;
  constructor(config: Config, workers: Workers) {
    this.workers = workers;
    this.load(config.testDir);
  }

  public subscribe(ws: WebSocket) {
    this.wss.push(ws);
    return () => {
      const wsIndex = this.wss.indexOf(ws);
      if (wsIndex >= 0) this.wss.splice(wsIndex, 1);
    };
  }

  load(testDir: string) {
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
    const queue = [];
    Object.keys(this.workers).forEach(browser => {
      this.workers[browser].forEach(worker => {});
    });
    //
    // get free worker
    // get test for that worker
    // send pending status for test
    // send start test for worker
    // flag worker as busy
    // subscribe worker on end
    // send result status for test
    // flag worker as free
    // repeat
  }

  stop() {}

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
