import path from 'path';
import { copyFile, mkdir } from 'fs';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import {
  Config,
  CreeveyStatus,
  TestResult,
  ApprovePayload,
  isDefined,
  CreeveyUpdate,
  TestStatus,
  ServerTest,
} from '../../types';
import Pool from './pool';

const copyFileAsync = promisify(copyFile);
const mkdirAsync = promisify(mkdir);

export default class Runner extends EventEmitter {
  private screenDir: string;
  private reportDir: string;
  private browsers: string[];
  private pools: { [browser: string]: Pool } = {};
  private tests: Partial<{ [id: string]: ServerTest }> = {};
  public get isRunning(): boolean {
    return Object.values(this.pools).some((pool) => pool.isRunning);
  }
  constructor(config: Config, storybookBundle: string) {
    super();

    this.screenDir = config.screenDir;
    this.reportDir = config.reportDir;
    this.browsers = Object.keys(config.browsers);
    this.browsers
      .map((browser) => (this.pools[browser] = new Pool(config, browser, storybookBundle)))
      .map((pool) => pool.on('test', this.handlePoolMessage));
  }

  private handlePoolMessage = (message: { id: string; status: TestStatus; result?: TestResult }): void => {
    const { id, status, result } = message;
    const test = this.tests[id];

    if (!test) return;
    test.status = status;
    if (!result) {
      this.sendUpdate({ tests: { [id]: { path: test.path, status, storyId: test.story.id } } });
      return;
    }
    if (!test.results) {
      test.results = [];
    }
    test.results.push(result);

    this.sendUpdate({ tests: { [id]: { path: test.path, status, results: [result], storyId: test.story.id } } });
  };

  private handlePoolStop = (): void => {
    if (!this.isRunning) {
      this.sendUpdate({ isRunning: false });
      this.emit('stop');
    }
  };

  public async init(): Promise<void> {
    await Promise.all(Object.values(this.pools).map((pool) => pool.init()));
  }

  public updateTests(testsDiff: Partial<{ [id: string]: ServerTest }>): void {
    const tests: CreeveyStatus['tests'] = {};
    const removedTests: string[][] = [];
    Object.entries(testsDiff).forEach(([id, newTest]) => {
      const oldTest = this.tests[id];
      if (newTest) {
        if (oldTest) {
          this.tests[id] = {
            ...newTest,
            status: 'unknown',
            retries: oldTest.retries,
            results: oldTest.results,
            approved: oldTest.approved,
          };
        } else this.tests[id] = newTest;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { story, fn, ...restTest } = newTest;
        tests[id] = { ...restTest, status: 'unknown' };
      } else {
        if (oldTest) removedTests.push(oldTest.path);
        delete this.tests[id];
      }
    });
    this.sendUpdate({ tests, removedTests });
  }

  public start(ids: string[]): void {
    interface TestsByBrowser {
      [browser: string]: { id: string; path: string[] }[];
    }
    if (this.isRunning) return;

    const testsToStart = ids
      .map((id) => this.tests[id])
      .filter(isDefined)
      .filter((test) => !test.skip);

    if (testsToStart.length == 0) return;

    this.sendUpdate({
      isRunning: true,
      tests: testsToStart.reduce(
        (update, { id }) => ({
          ...update,
          [id]: { path: this.tests[id]?.path, status: 'pending', storyId: this.tests[id]?.story.id },
        }),
        {},
      ),
    });

    const testsByBrowser: Partial<TestsByBrowser> = testsToStart.reduce((tests: TestsByBrowser, test) => {
      const { id, path } = test;
      const [browser, ...restPath] = path;
      test.status = 'pending';
      return {
        ...tests,
        [browser]: [...(tests[browser] || []), { id, path: restPath }],
      };
    }, {});

    this.browsers.forEach((browser) => {
      const pool = this.pools[browser];
      const tests = testsByBrowser[browser];

      if (tests && tests.length > 0 && pool.start(tests)) {
        pool.once('stop', this.handlePoolStop);
      }
    });
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.browsers.forEach((browser) => this.pools[browser].stop());
  }

  public get status(): CreeveyStatus {
    const tests: CreeveyStatus['tests'] = {};
    Object.values(this.tests)
      .filter(isDefined)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .forEach(({ story, fn, ...test }) => (tests[test.id] = { ...test, storyId: story.id }));
    return {
      isRunning: this.isRunning,
      tests,
    };
  }

  public async approve({ id, retry, image }: ApprovePayload): Promise<void> {
    const test = this.tests[id];
    if (!test || !test.results) return;
    const result = test.results[retry];
    if (!result || !result.images) return;
    const images = result.images[image];
    if (!images) return;
    if (!test.approved) {
      test.approved = {};
    }
    const [browser, ...restPath] = test.path;
    const testPath = path.join(...restPath.reverse(), image == browser ? '' : browser);
    const srcImagePath = path.join(this.reportDir, testPath, images.actual);
    const dstImagePath = path.join(this.screenDir, testPath, `${image}.png`);
    await mkdirAsync(path.join(this.screenDir, testPath), { recursive: true });
    await copyFileAsync(srcImagePath, dstImagePath);
    test.approved[image] = retry;
    this.sendUpdate({ tests: { [id]: { path: test.path, approved: { [image]: retry }, storyId: test.story.id } } });
  }

  private sendUpdate(data: CreeveyUpdate): void {
    this.emit('update', data);
  }
}
