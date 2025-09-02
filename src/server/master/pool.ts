import { Worker as ClusterWorker } from 'cluster';
import { EventEmitter } from 'events';
import { Worker, Config, TestResult, BrowserConfigObject, TestStatus } from '../../types.js';
import { createWorkerRPC, MasterRPC } from '../birpc-ipc.js';
import { gracefullyKill, isShuttingDown } from '../utils.js';
import { WorkerQueue } from './queue.js';

interface WorkerTest {
  id: string;
  path: string[];
  retries: number;
}

interface WorkerWithRPC extends Worker {
  rpc?: ReturnType<typeof createWorkerRPC>;
  currentTest?: WorkerTest;
}

export default class Pool extends EventEmitter {
  private maxRetries: number;
  private config: BrowserConfigObject;
  private workers: WorkerWithRPC[] = [];
  private queue: WorkerTest[] = [];
  private forcedStop = false;
  private failFast: boolean;
  private gridUrl?: string;
  private storybookUrl: string;
  public get isRunning(): boolean {
    return this.workers.length !== this.freeWorkers.length;
  }
  constructor(
    public scheduler: WorkerQueue,
    config: Config,
    private browser: string,
    gridUrl?: string,
  ) {
    super();

    this.failFast = config.failFast;
    this.maxRetries = config.maxRetries;
    this.config = config.browsers[browser] as BrowserConfigObject;
    this.gridUrl = this.config.gridUrl ?? gridUrl;
    this.storybookUrl = this.config.storybookUrl ?? config.storybookUrl;
  }

  async init(): Promise<void> {
    const poolSize = Math.max(1, this.config.limit ?? 1);
    const workerResults = await Promise.all(
      Array.from({ length: poolSize }).map(() =>
        this.scheduler.forkWorker(this.browser, this.storybookUrl, this.gridUrl),
      ),
    );

    this.workers = workerResults
      .filter((workerOrError): workerOrError is Worker => workerOrError instanceof ClusterWorker)
      .map((worker) => this.setupWorkerRPC(worker));

    if (this.workers.length != poolSize)
      throw new Error(`Can't instantiate workers for ${this.browser} due many errors`);

    this.workers.forEach((worker) => {
      this.exitHandler(worker);
    });
  }

  private setupWorkerRPC(worker: Worker): WorkerWithRPC {
    const workerWithRPC = worker as WorkerWithRPC;

    // Create master functions that this pool instance provides to workers
    const masterFunctions: Partial<MasterRPC> = {
      onWorkerReady: () => {
        // Worker is ready - no specific action needed for pool
        return Promise.resolve();
      },

      onWorkerError: (error) => {
        if (error.subtype === 'unknown') {
          gracefullyKill(workerWithRPC);
        }

        // Find the currently running test for this worker
        const currentTest = this.getCurrentTestForWorker(workerWithRPC);
        if (currentTest) {
          this.handleTestResult(workerWithRPC, currentTest, {
            status: 'failed',
            error: error.error,
            retries: currentTest.retries,
          });
        }
        return Promise.resolve();
      },

      onTestEnd: (result) => {
        // Find the currently running test for this worker
        const currentTest = this.getCurrentTestForWorker(workerWithRPC);
        if (currentTest) {
          this.handleTestResult(workerWithRPC, currentTest, result);
        }
        return Promise.resolve();
      },

      onStoriesCapture: () => {
        // Handle stories capture event if needed
        return Promise.resolve();
      },

      onPortRequest: () => {
        // This should be handled at a higher level for Docker containers
        return Promise.resolve(-1);
      },
    };

    workerWithRPC.rpc = createWorkerRPC(worker, masterFunctions);
    return workerWithRPC;
  }

  private getCurrentTestForWorker(worker: WorkerWithRPC): WorkerTest | null {
    return worker.currentTest ?? null;
  }

  start(tests: { id: string; path: string[] }[]): boolean {
    if (this.isRunning) return false;

    this.queue = tests.map(({ id, path }) => ({ id, path, retries: 0 }));
    void this.process();

    return true;
  }

  stop() {
    if (!this.isRunning) {
      this.emit('stop');
      return;
    }

    this.forcedStop = true;
    this.queue = [];
  }

  async process() {
    const worker = this.getFreeWorker();
    const test = this.queue.at(0);

    if (this.queue.length == 0 && this.workers.length === this.freeWorkers.length) {
      this.forcedStop = false;
      this.emit('stop');
      return;
    }

    if (!worker || !test || !worker.rpc) return;

    worker.isRunning = true;
    worker.currentTest = test; // Track which test this worker is running

    const { id } = test;

    this.queue.shift();
    this.sendStatus({ id, status: 'running' });

    try {
      // Use RPC call instead of sendTestMessage
      await worker.rpc.startTest(test);
    } catch (error) {
      // Handle RPC call failure
      this.handleTestResult(worker, test, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'RPC call failed',
        retries: test.retries,
      });
    }

    setImmediate(() => {
      void this.process();
    });
  }

  private sendStatus(message: { id: string; status: TestStatus; result?: TestResult }): void {
    this.emit('test', message);
  }

  private getFreeWorker(): WorkerWithRPC | undefined {
    const freeWorkers = this.freeWorkers;

    return freeWorkers[Math.floor(Math.random() * freeWorkers.length)];
  }

  private get aliveWorkers(): WorkerWithRPC[] {
    return this.workers.filter((worker) => !worker.exitedAfterDisconnect && !worker.isShuttingDown);
  }

  private get freeWorkers(): WorkerWithRPC[] {
    return this.aliveWorkers.filter((worker) => !worker.isRunning);
  }

  private exitHandler(worker: WorkerWithRPC): void {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    worker.once('exit', async () => {
      if (isShuttingDown.current) return;

      const workerOrError = await this.scheduler.forkWorker(this.browser, this.storybookUrl, this.gridUrl);

      if (!(workerOrError instanceof ClusterWorker))
        throw new Error(`Can't instantiate worker for ${this.browser} due many errors`);

      const newWorker = this.setupWorkerRPC(workerOrError);
      this.exitHandler(newWorker);
      this.workers[this.workers.indexOf(worker)] = newWorker;
      void this.process();
    });
  }

  private shouldRetry(test: WorkerTest): boolean {
    return test.retries < this.maxRetries && !this.forcedStop;
  }

  private handleTestResult(worker: WorkerWithRPC, test: WorkerTest, result: TestResult): void {
    const shouldRetry = result.status == 'failed' && this.shouldRetry(test);

    if (shouldRetry) {
      test.retries += 1;
      this.queue[this.failFast ? 'unshift' : 'push'](test);
    }

    this.sendStatus({ id: test.id, status: shouldRetry ? 'retrying' : result.status, result });

    worker.isRunning = false;
    worker.currentTest = undefined; // Clear the current test when done

    setImmediate(() => {
      void this.process();
    });
  }
}
