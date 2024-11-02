import { Worker as ClusterWorker } from 'cluster';
import { EventEmitter } from 'events';
import { Worker, Config, TestResult, BrowserConfig, TestStatus } from '../../types.js';
import { sendTestMessage, subscribeOnWorker } from '../messages.js';
import { gracefullyKill, isShuttingDown } from '../utils.js';
import { WorkerQueue } from './queue.js';

interface WorkerTest {
  id: string;
  path: string[];
  retries: number;
}

export default class Pool extends EventEmitter {
  private maxRetries: number;
  private config: BrowserConfig;
  private workers: Worker[] = [];
  private queue: WorkerTest[] = [];
  private forcedStop = false;
  private failFast: boolean;
  public get isRunning(): boolean {
    return this.workers.length !== this.freeWorkers.length;
  }
  constructor(
    public scheduler: WorkerQueue,
    config: Config,
    private browser: string,
  ) {
    super();

    this.failFast = config.failFast;
    this.maxRetries = config.maxRetries;
    this.config = config.browsers[browser] as BrowserConfig;
  }

  async init(): Promise<void> {
    const poolSize = Math.max(1, this.config.limit ?? 1);
    this.workers = (
      await Promise.all(Array.from({ length: poolSize }).map(() => this.scheduler.forkWorker(this.browser)))
    ).filter((workerOrError): workerOrError is Worker => workerOrError instanceof ClusterWorker);
    if (this.workers.length != poolSize)
      throw new Error(`Can't instantiate workers for ${this.browser} due many errors`);
    this.workers.forEach((worker) => {
      this.exitHandler(worker);
    });
  }

  start(tests: { id: string; path: string[] }[]): boolean {
    if (this.isRunning) return false;

    this.queue = tests.map(({ id, path }) => ({ id, path, retries: 0 }));
    this.process();

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

  process() {
    const worker = this.getFreeWorker();
    const test = this.queue.at(0);

    if (this.queue.length == 0 && this.workers.length === this.freeWorkers.length) {
      this.forcedStop = false;
      this.emit('stop');
      return;
    }

    if (!worker || !test) return;

    worker.isRunning = true;

    const { id } = test;

    this.queue.shift();
    this.sendStatus({ id, status: 'running' });

    this.subscribe(worker, test);

    sendTestMessage(worker, { type: 'start', payload: test });

    setImmediate(() => {
      this.process();
    });
  }

  private sendStatus(message: { id: string; status: TestStatus; result?: TestResult }): void {
    this.emit('test', message);
  }

  private getFreeWorker(): Worker | undefined {
    const freeWorkers = this.freeWorkers;

    return freeWorkers[Math.floor(Math.random() * freeWorkers.length)];
  }

  private get aliveWorkers(): Worker[] {
    return this.workers.filter((worker) => !worker.exitedAfterDisconnect && !worker.isShuttingDown);
  }

  private get freeWorkers(): Worker[] {
    return this.aliveWorkers.filter((worker) => !worker.isRunning);
  }

  private exitHandler(worker: Worker): void {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    worker.once('exit', async () => {
      if (isShuttingDown.current) return;

      const workerOrError = await this.scheduler.forkWorker(this.browser);

      if (!(workerOrError instanceof ClusterWorker))
        throw new Error(`Can't instantiate worker for ${this.browser} due many errors`);

      this.exitHandler(workerOrError);
      this.workers[this.workers.indexOf(worker)] = workerOrError;
      this.process();
    });
  }

  private shouldRetry(test: WorkerTest): boolean {
    return test.retries < this.maxRetries && !this.forcedStop;
  }

  private handleTestResult(worker: Worker, test: WorkerTest, result: TestResult): void {
    const shouldRetry = result.status == 'failed' && this.shouldRetry(test);

    if (shouldRetry) {
      test.retries += 1;
      this.queue[this.failFast ? 'unshift' : 'push'](test);
    }

    this.sendStatus({ id: test.id, status: shouldRetry ? 'retrying' : result.status, result });

    worker.isRunning = false;

    setImmediate(() => {
      this.process();
    });
  }

  private subscribe(worker: Worker, test: WorkerTest): void {
    const subscriptions = [
      subscribeOnWorker(worker, 'worker', (message) => {
        if (message.type != 'error') return;

        subscriptions.forEach((unsubscribe) => {
          unsubscribe();
        });

        if (message.payload.subtype == 'unknown') {
          gracefullyKill(worker);
        }

        this.handleTestResult(worker, test, { status: 'failed', error: message.payload.error });
      }),
      subscribeOnWorker(worker, 'test', (message) => {
        if (message.type != 'end') return;

        subscriptions.forEach((unsubscribe) => {
          unsubscribe();
        });

        this.handleTestResult(worker, test, message.payload);
      }),
    ];
  }
}
