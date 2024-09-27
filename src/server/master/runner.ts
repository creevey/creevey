import path from 'path';
import { copyFile, mkdir } from 'fs/promises';
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
  TestMeta,
} from '../../types.js';
import Pool from './pool.js';

export default class Runner extends EventEmitter {
  private failFast: boolean;
  private screenDir: string;
  private reportDir: string;
  private browsers: string[];
  private pools: Record<string, Pool> = {};
  tests: Partial<Record<string, ServerTest>> = {};
  public get isRunning(): boolean {
    return Object.values(this.pools).some((pool) => pool.isRunning);
  }
  constructor(config: Config) {
    super();

    this.failFast = config.failFast;
    this.screenDir = config.screenDir;
    this.reportDir = config.reportDir;
    this.browsers = Object.keys(config.browsers);
    this.browsers
      .map((browser) => (this.pools[browser] = new Pool(config, browser)))
      .map((pool) => pool.on('test', this.handlePoolMessage));
  }

  private handlePoolMessage = (message: { id: string; status: TestStatus; result?: TestResult }): void => {
    const { id, status, result } = message;
    const test = this.tests[id];

    if (!test) return;
    const { browser, testName, storyPath, storyId } = test;
    // TODO Handle 'retrying' status
    test.status = status == 'retrying' ? 'failed' : status;
    if (!result) {
      this.sendUpdate({ tests: { [id]: { id, browser, testName, storyPath, status: test.status, storyId } } });
      return;
    }
    if (!test.results) {
      test.results = [];
    }
    test.results.push(result);

    this.sendUpdate({
      tests: { [id]: { id, browser, testName, storyPath, status: test.status, results: [result], storyId } },
    });

    if (this.failFast && status == 'failed') this.stop();
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

  public updateTests(testsDiff: Partial<Record<string, ServerTest>>): void {
    const tests: CreeveyStatus['tests'] = {};
    const removedTests: TestMeta[] = [];
    Object.entries(testsDiff).forEach(([id, newTest]) => {
      const oldTest = this.tests[id];
      if (newTest) {
        if (oldTest) {
          this.tests[id] = {
            ...newTest,
            retries: oldTest.retries,
            results: oldTest.results,
            approved: oldTest.approved,
          };
        } else this.tests[id] = newTest;

        const { story: _, fn: __, ...restTest } = newTest;
        tests[id] = { ...restTest, status: 'unknown' };
      } else if (oldTest) {
        const { id, browser, testName, storyPath, storyId } = oldTest;
        removedTests.push({ id, browser, testName, storyPath, storyId });
        // TODO Use Map instead
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.tests[id];
      }
    });
    this.sendUpdate({ tests, removedTests });
  }

  public start(ids: string[]): void {
    type TestsByBrowser = Record<string, { id: string; path: string[] }[]>;
    if (this.isRunning) return;

    const testsToStart = ids
      .map((id) => this.tests[id])
      .filter(isDefined)
      .filter((test) => !test.skip);

    if (testsToStart.length == 0) return;

    this.sendUpdate({
      isRunning: true,
      tests: testsToStart.reduce(
        (update: CreeveyUpdate['tests'], { id, storyId, browser, testName, storyPath }) => ({
          ...update,
          [id]: { id, browser, testName, storyPath, status: 'pending', storyId },
        }),
        {},
      ),
    });

    const testsByBrowser: Partial<TestsByBrowser> = testsToStart.reduce((tests: Partial<TestsByBrowser>, test) => {
      const { id, browser, testName, storyPath } = test;
      const restPath = [...storyPath, testName].filter(isDefined);
      test.status = 'pending';
      return {
        ...tests,
        [browser]: [...(tests[browser] ?? []), { id, path: restPath }],
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
    this.browsers.forEach((browser) => {
      this.pools[browser].stop();
    });
  }

  public get status(): CreeveyStatus {
    const tests: CreeveyStatus['tests'] = {};
    Object.values(this.tests)
      .filter(isDefined)

      .forEach(({ story: _, fn: __, ...test }) => (tests[test.id] = test));
    return {
      isRunning: this.isRunning,
      tests,
      browsers: this.browsers,
    };
  }

  public async approve({ id, retry, image }: ApprovePayload): Promise<void> {
    const test = this.tests[id];
    if (!test?.results) return;
    const result = test.results[retry];
    if (!result.images) return;
    const images = result.images[image];
    if (!images) return;
    if (!test.approved) {
      test.approved = {};
    }
    const { browser, testName, storyPath } = test;
    const restPath = [...storyPath, testName].filter(isDefined);
    const testPath = path.join(...restPath, image == browser ? '' : browser);
    const srcImagePath = path.join(this.reportDir, testPath, images.actual);
    const dstImagePath = path.join(this.screenDir, testPath, `${image}.png`);
    await mkdir(path.join(this.screenDir, testPath), { recursive: true });
    await copyFile(srcImagePath, dstImagePath);
    test.approved[image] = retry;
    this.sendUpdate({
      tests: { [id]: { id, browser, testName, storyPath, approved: { [image]: retry }, storyId: test.storyId } },
    });
  }
  private sendUpdate(data: CreeveyUpdate): void {
    this.emit('update', data);
  }
}
