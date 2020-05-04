import cluster from 'cluster';
import { EventEmitter } from 'events';
import { Worker, Config, TestResult, BrowserConfig, WorkerMessage, TestStatus } from '../../types';

const FORK_RETRIES = 5;

export default class Pool extends EventEmitter {
  private maxRetries: number;
  private browser: string;
  private config: BrowserConfig;
  private workers: Worker[] = [];
  private queue: { id: string; path: string[]; retries: number }[] = [];
  private forcedStop = false;
  public get isRunning(): boolean {
    return this.workers.length !== this.freeWorkers.length;
  }
  constructor(config: Config, browser: string) {
    super();

    this.maxRetries = config.maxRetries;
    this.browser = browser;
    this.config = config.browsers[browser] as BrowserConfig;
  }

  async init(): Promise<void> {
    const poolSize = this.config.limit || 1;
    this.workers = (await Promise.all(Array.from({ length: poolSize }).map(() => this.forkWorker()))).filter(
      (workerOrError): workerOrError is Worker => workerOrError instanceof cluster.Worker,
    );
    if (this.workers.length != poolSize)
      throw new Error(`Can't instantiate workers for ${this.browser} due many errors`);
    this.workers.forEach((worker) => this.exitHandler(worker));
  }

  start(tests: { id: string; path: string[] }[]): boolean {
    if (this.isRunning) return false;

    this.queue = tests.map(({ id, path }) => ({ id, path, retries: 0 }));
    this.process();

    return true;
  }

  stop(): void {
    // TODO Timeout
    if (!this.isRunning) {
      // TODO this.emit("stop");
      return;
    }

    this.forcedStop = true;
    this.queue = [];
  }

  process(): void {
    const worker = this.getFreeWorker();
    const [test] = this.queue;

    if (this.queue.length == 0 && this.workers.length === this.freeWorkers.length) {
      this.forcedStop = false;
      this.emit('stop');
      return;
    }

    if (!worker || !test) return;

    const { id } = test;

    this.queue.shift();

    this.sendStatus({ id, status: 'running' });

    worker.isRunning = true;
    worker.once('message', (data) => {
      const message: WorkerMessage = JSON.parse(data);
      if (message.type == 'ready') return;
      if (message.type == 'error') worker.disconnect();

      const { payload: result } = message;
      const { status } = result;
      const shouldRetry = status == 'failed' && test.retries < this.maxRetries && !this.forcedStop;

      if (shouldRetry) {
        test.retries += 1;
        this.queue.push(test);
      }

      worker.isRunning = false;

      this.sendStatus({ id, status, result });
      this.process();
    });
    worker.send(JSON.stringify(test));
    this.process();
  }

  private sendStatus(message: { id: string; status: TestStatus; result?: TestResult }): void {
    this.emit('test', message);
  }

  private getFreeWorker(): Worker | undefined {
    return this.freeWorkers[Math.floor(Math.random() * this.freeWorkers.length)];
  }

  private get aliveWorkers(): Worker[] {
    return this.workers.filter((worker) => !worker.exitedAfterDisconnect);
  }

  private get freeWorkers(): Worker[] {
    return this.aliveWorkers.filter((worker) => !worker.isRunning);
  }

  private async forkWorker(retry = 0): Promise<Worker | { error: string }> {
    cluster.setupMaster({ args: ['--browser', this.browser, ...process.argv.slice(2)] });
    const worker = cluster.fork();
    const data = await new Promise((resolve: (value: string) => void) => worker.once('message', resolve));
    const message: WorkerMessage = JSON.parse(data);

    if (message.type != 'error') return worker;

    worker.disconnect();

    if (retry == FORK_RETRIES) return message.payload;
    return this.forkWorker(retry + 1);
  }

  private exitHandler(worker: Worker): void {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    worker.once('exit', async () => {
      const workerOrError = await this.forkWorker();

      if (!(workerOrError instanceof cluster.Worker))
        throw new Error(`Can't instantiate worker for ${this.browser} due many errors`);

      this.exitHandler(workerOrError);
      this.workers[this.workers.indexOf(worker)] = workerOrError;
      this.process();
    });
  }
}
