import cluster, { Worker as ClusterWorker } from 'cluster';
import { EventEmitter } from 'events';
import {
  Worker,
  Config,
  TestResult,
  BrowserConfigObject,
  WorkerMessage,
  TestStatus,
  isWorkerMessage,
} from '../../types.js';
import { sendTestMessage, sendShutdownMessage, subscribeOnWorker } from '../messages.js';
import { isShuttingDown } from '../utils.js';

const FORK_RETRIES = 5;

interface WorkerTest {
  id: string;
  path: string[];
  retries: number;
}

export default class Pool extends EventEmitter {
  private maxRetries: number;
  private config: BrowserConfigObject;
  private workers: Worker[] = [];
  private queue: WorkerTest[] = [];
  private forcedStop = false;
  private failFast: boolean;
  private gridUrl?: string;
  public get isRunning(): boolean {
    return this.workers.length !== this.freeWorkers.length;
  }
  constructor(
    config: Config,
    private browser: string,
    gridUrl?: string,
  ) {
    super();

    this.failFast = config.failFast;
    this.maxRetries = config.maxRetries;
    this.config = config.browsers[browser] as BrowserConfigObject;
    this.gridUrl = this.config.gridUrl ?? gridUrl;
  }

  async init(): Promise<void> {
    const poolSize = Math.max(1, this.config.limit ?? 1);
    // TODO Init queue for workers to smooth browser starting load
    this.workers = (await Promise.all(Array.from({ length: poolSize }).map(() => this.forkWorker()))).filter(
      (workerOrError): workerOrError is Worker => workerOrError instanceof ClusterWorker,
    );
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

  stop(): void {
    if (!this.isRunning) {
      this.emit('stop');
      return;
    }

    this.forcedStop = true;
    this.queue = [];
  }

  process(): void {
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

    this.process();
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

  private async forkWorker(retry = 0): Promise<Worker | { error: string }> {
    cluster.setupPrimary({
      args: ['--browser', this.browser, ...(this.gridUrl ? ['--gridUrl', this.gridUrl] : []), ...process.argv.slice(2)],
    });
    const worker = cluster.fork();
    const message = await new Promise((resolve: (value: WorkerMessage) => void) => {
      const readyHandler = (message: unknown): void => {
        if (!isWorkerMessage(message) || message.type == 'port') return;
        worker.off('message', readyHandler);
        resolve(message);
      };
      worker.on('message', readyHandler);
    });

    if (message.type != 'error') return worker;

    this.gracefullyKill(worker);

    if (retry == FORK_RETRIES) return message.payload;
    return this.forkWorker(retry + 1);
  }

  private exitHandler(worker: Worker): void {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    worker.once('exit', async () => {
      if (isShuttingDown.current) return;

      const workerOrError = await this.forkWorker();

      if (!(workerOrError instanceof ClusterWorker))
        throw new Error(`Can't instantiate worker for ${this.browser} due many errors`);

      this.exitHandler(workerOrError);
      this.workers[this.workers.indexOf(worker)] = workerOrError;
      this.process();
    });
  }

  private gracefullyKill(worker: Worker): void {
    worker.isShuttingDown = true;
    const timeout = setTimeout(() => {
      worker.kill();
    }, 10000);
    worker.on('exit', () => {
      clearTimeout(timeout);
    });
    sendShutdownMessage(worker);
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
          this.gracefullyKill(worker);
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
