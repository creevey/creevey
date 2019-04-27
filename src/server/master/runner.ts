import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import uuid from "uuid";
import { Config, Test, CreeveyStatus, Tests, TestStatus, TestUpdate } from "../../types";
import Pool from "./pool";

// TODO status
export default class Runner extends EventEmitter {
  private testDir: string;
  private tests: { [id: string]: Test } = {};
  private browsers: string[];
  private pools: { [browser: string]: Pool } = {};
  private isRunning: boolean = false;
  constructor(config: Config) {
    super();

    this.testDir = config.testDir;
    this.browsers = Object.keys(config.browsers);
    this.browsers
      .map(browser => (this.pools[browser] = new Pool(config, browser)))
      .map(pool => pool.on("test", this.handlePoolMessage));
  }

  private handlePoolMessage = (message: { test: Test; status: TestStatus }) => {
    const {
      status,
      test: { id }
    } = message;
    const test = this.tests[id];
    if (!test.result) {
      test.result = {};
    }
    if (status == "pending") {
      test.retries += 1;
    }
    // TODO add images
    test.result[test.retries] = { status };
    this.tests[message.test.id];
    const testUpdate: TestUpdate = {
      status,
      path: [...test.path].reverse(),
      retry: test.retries
    };
    this.emit("test", testUpdate);
  };

  public loadTests() {
    console.log("[CreeveyRunner]:", "Start loading tests");
    // TODO load tests from separated process
    const { browsers, tests } = this;
    let suites: string[] = [];

    function describe(title: string, describeFn: () => void) {
      suites = [title, ...suites];
      describeFn();
      [, ...suites] = suites;
    }

    function it(title: string): Test[] {
      return browsers
        .map(browser => ({ id: uuid.v4(), path: [browser, title, ...suites], retries: 0 }))
        .map(test => (tests[test.id] = test));
    }

    it.skip = function skip(browsers: string[], title: string) {
      it(title)
        .filter(({ path: [browser] }) => browsers.includes(browser))
        .forEach(test => (tests[test.id].skip = true));
    };

    // @ts-ignore
    global.describe = describe;
    // @ts-ignore
    global.it = it;

    fs.readdirSync(this.testDir).forEach(file => require(path.join(this.testDir, file)));
    console.log("[CreeveyRunner]:", "Tests loaded");
  }

  public start(ids: string[]) {
    if (this.isRunning) return;

    this.isRunning = true;
    // TODO send running status

    const tests: { [browser: string]: { id: string; path: string[] }[] } = {};

    this.browsers.forEach(browser => (tests[browser] = []));

    ids
      .map(id => this.tests[id])
      .filter(({ skip }) => !skip)
      .forEach(({ path: [browser, ...path], id }) => tests[browser].push({ id, path }));

    this.browsers.forEach(browser => this.pools[browser].start(tests[browser]));
    // TODO subscribe on stop
  }

  public stop() {
    if (!this.isRunning) return;
    // TODO wait for stop
    this.browsers.forEach(browser => this.pools[browser].stop());
    this.isRunning = false;
    // TODO send running status
  }

  public get status(): CreeveyStatus {
    const tests: Tests = {};
    Object.values(this.tests).forEach(test => {
      const [browser, ...suitePath] = test.path;
      const lastSuite = suitePath
        .reverse()
        .reduce((suite, token) => (suite[token] = (suite[token] || {}) as Tests), tests);
      lastSuite[browser] = { ...test, path: [...test.path].reverse() };
    });
    return {
      isRunning: this.isRunning,
      tests
    };
  }
}
