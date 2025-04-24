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
  TEST_EVENTS,
  FakeSuite,
  FakeTest,
} from '../../types.js';
import Pool from './pool.js';
import { WorkerQueue } from './queue.js';
import { getTestPath } from '../utils.js';
import { getReporter } from '../reporters/index.js';
import { TestsManager } from './testsManager.js';

// NOTE: This is workaround to fix parallel tests running with mocha-junit-reporter
let isJUnit = false;

class FakeRunner extends EventEmitter {
  public stats = {
    duration: 0,
    failures: 0,
    pending: 0,
  };
}

export default class Runner extends EventEmitter {
  private failFast: boolean;
  private browsers: string[];
  private scheduler: WorkerQueue;
  private pools: Record<string, Pool> = {};
  private fakeRunner: FakeRunner;
  private config: Config;
  public testsManager: TestsManager;

  public get isRunning(): boolean {
    return Object.values(this.pools).some((pool) => pool.isRunning);
  }

  constructor(config: Config, testsManager: TestsManager, gridUrl?: string) {
    super();

    this.config = config;
    this.failFast = config.failFast;
    this.testsManager = testsManager;
    this.scheduler = new WorkerQueue(config.useWorkerQueue);
    this.browsers = Object.keys(config.browsers);

    const runner = new FakeRunner();
    const Reporter = getReporter(config.reporter);

    if (Reporter.name == 'MochaJUnitReporter') {
      isJUnit = true;
    }

    new Reporter(runner, { reportDir: config.reportDir, reporterOptions: config.reporterOptions });
    this.fakeRunner = runner;

    this.browsers
      .map((browser) => (this.pools[browser] = new Pool(this.scheduler, config, browser, gridUrl)))
      .map((pool) => pool.on('test', this.handlePoolMessage));
  }

  private handlePoolMessage = (message: { id: string; status: TestStatus; result?: TestResult }): void => {
    const { id, status, result } = message;
    const test = this.testsManager.getTest(id);

    if (!test) return;
    const { browser, testName } = test;

    const fakeSuite: FakeSuite = {
      title: test.storyPath.slice(0, -1).join('/'),
      fullTitle: () => fakeSuite.title,
      titlePath: () => [fakeSuite.title],
      tests: [],
    };

    const fakeTest: FakeTest = {
      parent: fakeSuite,
      title: [test.story.name, testName, browser].filter(isDefined).join('/'),
      fullTitle: () => getTestPath(test).join('/'),
      titlePath: () => getTestPath(test),
      currentRetry: () => result?.retries,
      retires: () => this.config.maxRetries,
      slow: () => 1000,
      err: result?.error,
      creevey: {
        sessionId: result?.sessionId ?? id,
        browserName: result?.browserName ?? browser,
        workerId: result?.workerId ?? process.pid,
        willRetry: (result?.retries ?? 0) < this.config.maxRetries,
        images: result?.images ?? {},
      },
    };

    fakeSuite.tests.push(fakeTest);

    const update = this.testsManager.updateTestStatus(id, status, result);
    if (!update) return;

    if (!result) {
      this.fakeRunner.emit(TEST_EVENTS.TEST_BEGIN, fakeTest);
      this.sendUpdate(update);
      return;
    }

    const { duration, attachments } = result;

    fakeTest.duration = duration;
    fakeTest.attachments = attachments;
    fakeTest.state = result.status === 'failed' ? 'failed' : 'passed';
    if (duration !== undefined) {
      fakeTest.speed = duration > fakeTest.slow() ? 'slow' : duration / 2 > fakeTest.slow() ? 'medium' : 'fast';
    }

    if (isJUnit) {
      this.fakeRunner.emit(TEST_EVENTS.SUITE_BEGIN, fakeSuite);
    }

    if (result.status === 'failed') {
      fakeTest.err = result.error;
      this.fakeRunner.emit(TEST_EVENTS.TEST_FAIL, fakeTest, result.error);
      this.fakeRunner.stats.failures++;
    } else {
      this.fakeRunner.emit(TEST_EVENTS.TEST_PASS, fakeTest);
      this.fakeRunner.stats.duration += duration ?? 0;
    }

    if (isJUnit) {
      this.fakeRunner.emit(TEST_EVENTS.SUITE_END, fakeSuite);
    }

    this.fakeRunner.emit(TEST_EVENTS.TEST_END, fakeTest);

    this.sendUpdate(update);

    if (this.failFast && status == 'failed') this.stop();
  };

  private handlePoolStop = (): void => {
    if (!this.isRunning) {
      this.fakeRunner.emit(TEST_EVENTS.RUN_END);
      this.sendUpdate({ isRunning: false });
      this.emit('stop');
    }
  };

  public async init(): Promise<void> {
    await Promise.all(Object.values(this.pools).map((pool) => pool.init()));
  }

  public updateTests(testsDiff: Partial<Record<string, ServerTest>>): void {
    const update = this.testsManager.updateTests(testsDiff);
    if (update) this.sendUpdate(update);
  }

  public start(ids: string[]): void {
    type TestsByBrowser = Record<string, { id: string; path: string[] }[]>;
    if (this.isRunning) return;

    const testsToStart = ids
      .map((id) => this.testsManager.getTest(id))
      .filter(isDefined)
      .filter((test) => !test.skip);

    if (testsToStart.length == 0) return;

    const pendingTests: CreeveyUpdate['tests'] = testsToStart.reduce(
      (update: CreeveyUpdate['tests'], { id, storyId, browser, testName, storyPath }) => ({
        ...update,
        [id]: { id, browser, testName, storyPath, status: 'pending', storyId },
      }),
      {},
    );

    this.sendUpdate({
      isRunning: true,
      tests: pendingTests,
    });

    const testsByBrowser: Partial<TestsByBrowser> = testsToStart.reduce((tests: Partial<TestsByBrowser>, test) => {
      const { id, browser, testName, storyPath } = test;
      const restPath = [...storyPath, testName].filter(isDefined);

      // Update status to pending in TestsManager
      this.testsManager.updateTestStatus(id, 'pending');

      return {
        ...tests,
        [browser]: [...(tests[browser] ?? []), { id, path: restPath }],
      };
    }, {});

    this.fakeRunner.emit(TEST_EVENTS.RUN_BEGIN);
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
    return {
      isRunning: this.isRunning,
      tests: this.testsManager.getTestsData(),
      browsers: this.browsers,
      isUpdateMode: false,
    };
  }

  public async approveAll(): Promise<void> {
    const update = await this.testsManager.approveAll();
    this.sendUpdate(update);
  }

  public async approve(payload: ApprovePayload): Promise<void> {
    const update = await this.testsManager.approve(payload);
    if (update) this.sendUpdate(update);
  }

  private sendUpdate(data: CreeveyUpdate): void {
    this.emit('update', data);
  }
}
