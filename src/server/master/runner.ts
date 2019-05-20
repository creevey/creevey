import path from "path";
import { copyFile } from "fs";
import { promisify } from "util";
import { EventEmitter } from "events";
import mkdirp from "mkdirp";
import { Config, Test, CreeveyStatus, TestUpdate, TestResult, ApprovePayload, isDefined } from "../../types";
import Pool from "./pool";

const copyFileAsync = promisify(copyFile);
const mkdirpAsync = promisify(mkdirp);

export default class Runner extends EventEmitter {
  private screenDir: string;
  private reportDir: string;
  private tests: Partial<{ [id: string]: Test }> = {};
  private browsers: string[];
  private pools: { [browser: string]: Pool } = {};
  public get isRunning(): boolean {
    return Object.values(this.pools).some(pool => pool.isRunning);
  }
  constructor(config: Config, tests: Partial<{ [id: string]: Test }>) {
    super();

    this.tests = tests;
    this.screenDir = config.screenDir;
    this.reportDir = config.reportDir;
    this.browsers = Object.keys(config.browsers);
    this.browsers
      .map(browser => (this.pools[browser] = new Pool(config, browser)))
      .map(pool => pool.on("test", this.handlePoolMessage));
  }

  private handlePoolMessage = (message: { id: string; result: TestResult }) => {
    const { result, id } = message;
    const test = this.tests[id];
    if (!test) return;
    if (!test.results) {
      test.results = {};
    }
    if (result.status == "running") {
      test.retries += 1;
    }
    test.results[test.retries] = result;
    const testUpdate: TestUpdate = {
      id,
      retry: test.retries,
      ...result
    };
    this.emit("test", testUpdate);
  };

  private handlePoolStop = () => {
    if (!this.isRunning) {
      this.emit("stop");
    }
  };

  public start(ids: string[]) {
    // TODO set tests status => pending
    if (this.isRunning) return;

    const testsToStart = ids
      .map(id => this.tests[id])
      .filter(isDefined)
      .filter(test => !test.skip);
    const testsByBrowser: { [browser: string]: { id: string; path: string[] }[] } = {};

    this.browsers.forEach(browser => (testsByBrowser[browser] = []));

    testsToStart.forEach(({ path: [browser, ...path], id }) => testsByBrowser[browser].push({ id, path }));

    // TODO check testsToStart length
    this.browsers.forEach(browser => {
      const pool = this.pools[browser];

      if (pool.start(testsByBrowser[browser])) {
        pool.once("stop", this.handlePoolStop);
      }
    });
    this.emit("start", testsToStart.map(({ id }) => id));
  }

  public stop() {
    if (!this.isRunning) return;
    this.browsers.forEach(browser => this.pools[browser].stop());
  }

  public get status(): CreeveyStatus {
    return {
      isRunning: this.isRunning,
      testsById: this.tests
    };
  }

  public async approve({ id, retry, image }: ApprovePayload) {
    const test = this.tests[id];
    if (!test || !test.results) return;
    const result = test.results[retry];
    if (!result || !result.images) return;
    const images = result.images[image];
    if (!images) return;
    const testPath = path.join(...[...test.path].reverse());
    const srcImagePath = path.join(this.reportDir, testPath, images.actual);
    const dstImagePath = path.join(this.screenDir, testPath, `${image}.png`);
    await mkdirpAsync(path.join(this.screenDir, testPath));
    await copyFileAsync(srcImagePath, dstImagePath);
  }
}
