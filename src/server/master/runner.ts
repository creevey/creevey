import path from "path";
import { copyFile } from "fs";
import { promisify } from "util";
import { EventEmitter } from "events";
import { createHash } from "crypto";
import mkdirp from "mkdirp";
import {
  Config,
  Test,
  CreeveyStatus,
  TestResult,
  ApprovePayload,
  isDefined,
  CreeveyUpdate,
  TestStatus,
  WithCreeveyParameters
} from "../../types";
import { shouldSkip } from "../../utils";
import Pool from "./pool";

const copyFileAsync = promisify(copyFile);
const mkdirpAsync = promisify(mkdirp);

export default class Runner extends EventEmitter {
  private screenDir: string;
  private reportDir: string;
  public tests: Partial<{ [id: string]: Test }> = {};
  private browsers: string[];
  private pools: { [browser: string]: Pool } = {};
  public get isRunning(): boolean {
    return Object.values(this.pools).some(pool => pool.isRunning);
  }
  constructor(config: Config) {
    super();

    this.screenDir = config.screenDir;
    this.reportDir = config.reportDir;
    this.browsers = Object.keys(config.browsers);
    this.browsers
      .map(browser => (this.pools[browser] = new Pool(config, browser)))
      .map(pool => pool.on("test", this.handlePoolMessage));
  }

  private handlePoolMessage = (message: { id: string; status: TestStatus; result?: TestResult }) => {
    const { id, status, result } = message;
    const test = this.tests[id];
    if (!test) return;
    test.status = status;
    if (!result) {
      this.sendUpdate({ testsById: { [id]: { status } } });
      return;
    }
    if (!test.results) {
      test.results = [];
    }
    test.results.push(result);
    this.sendUpdate({ testsById: { [id]: { status, results: [result] } } });
  };

  private handlePoolStop = () => {
    if (!this.isRunning) {
      this.sendUpdate({ isRunning: false });
      this.emit("stop");
    }
  };

  public async init(): Promise<Partial<{ [id: string]: Test }>> {
    // TODO init return array of stories for every browser. Convert stories to tests, merge with tests
    const tests: Partial<{ [id: string]: Test }> = {};
    await Promise.all(
      Object.entries(this.pools).map(async ([browser, pool]) => {
        const stories = await pool.init();
        if (!stories) return;
        Object.values(stories).forEach(story => {
          const params = story.parameters.creevey as WithCreeveyParameters;
          const testPath = [browser, story.name, story.name, story.kind];
          const testId = createHash("sha1")
            .update(testPath.join("/"))
            .digest("hex");
          tests[testId] = {
            id: testId,
            path: testPath,
            retries: 0,
            skip: params.skip ? shouldSkip(story.name, browser, params.skip) : false
          };
        });
      })
    );
    return tests;
  }

  public start(ids: string[]) {
    interface TestsByBrowser {
      [browser: string]: { id: string; path: string[] }[];
    }
    if (this.isRunning) return;

    const testsToStart = ids
      .map(id => this.tests[id])
      .filter(isDefined)
      .filter(test => !test.skip);

    if (testsToStart.length == 0) return;

    this.sendUpdate({
      isRunning: true,
      testsById: testsToStart.reduce((update, { id }) => ({ ...update, [id]: { status: "pending" } }), {})
    });

    const testsByBrowser: Partial<TestsByBrowser> = testsToStart.reduce((tests: TestsByBrowser, test) => {
      const { id, path } = test;
      const [browser, ...restPath] = path;
      test.status = "pending";
      return {
        ...tests,
        [browser]: [...(tests[browser] || []), { id, path: restPath }]
      };
    }, {});

    this.browsers.forEach(browser => {
      const pool = this.pools[browser];
      const tests = testsByBrowser[browser];

      if (tests && tests.length > 0 && pool.start(tests)) {
        pool.once("stop", this.handlePoolStop);
      }
    });
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
    if (!test.approved) {
      test.approved = {};
    }
    const testPath = path.join(...[...test.path].reverse());
    const srcImagePath = path.join(this.reportDir, testPath, images.actual);
    const dstImagePath = path.join(this.screenDir, testPath, `${image}.png`);
    await mkdirpAsync(path.join(this.screenDir, testPath));
    await copyFileAsync(srcImagePath, dstImagePath);
    test.approved[image] = retry;
    this.sendUpdate({ testsById: { [id]: { approved: { [image]: retry } } } });
  }

  private sendUpdate(data: CreeveyUpdate) {
    this.emit("update", data);
  }
}
