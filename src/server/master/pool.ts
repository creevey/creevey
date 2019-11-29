import cluster from 'cluster';
import { EventEmitter } from 'events';
import { Worker, Config, TestResult, BrowserConfig, WorkerMessage, TestStatus, Test } from '../../types';

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

  init(): Promise<Partial<{ [id: string]: Test }> | undefined> {
    this.workers = Array.from({ length: this.config.limit || 1 }).map(() => {
      cluster.setupMaster({ args: ['--browser', this.browser, ...process.argv.slice(2)] });
      const worker = cluster.fork();
      this.exitHandler(worker);
      return worker;
    });
    // TODO handle errors
    return Promise.all(
      this.workers.map(worker => new Promise((resolve: (value: string) => void) => worker.once('message', resolve))),
    ).then(([data]) => {
      const message: WorkerMessage = JSON.parse(data);
      if (message.type == 'ready') return message.payload.tests;
      if (message.type == 'error') throw message.payload.error;
    });
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

    worker.isRunnning = true;
    worker.once('message', data => {
      const message: WorkerMessage = JSON.parse(data);
      if (message.type == 'ready') return;
      if (message.type == 'error') worker.kill();

      const { payload: result } = message;
      const { status } = result;
      const shouldRetry = status == 'failed' && test.retries < this.maxRetries && !this.forcedStop;

      if (shouldRetry) {
        test.retries += 1;
        this.queue.push(test);
      }

      worker.isRunnning = false;

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
    return this.workers.filter(worker => !worker.exitedAfterDisconnect);
  }

  private get freeWorkers(): Worker[] {
    return this.aliveWorkers.filter(worker => !worker.isRunnning);
  }

  private exitHandler(worker: Worker): void {
    worker.once('exit', () => {
      cluster.setupMaster({ args: ['--browser', this.browser, ...process.argv.slice(2)] });
      const newWorker = cluster.fork();
      this.exitHandler(newWorker);
      // TODO handle errors
      newWorker.once('message', () => {
        this.workers[this.workers.indexOf(worker)] = newWorker;
        this.process();
      });
    });
  }
}
