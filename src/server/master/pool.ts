import cluster from "cluster";
import { EventEmitter } from "events";
import { Worker, Config, TestResult, Capabilities, BrowserConfig, WorkerMessage, TestStatus } from "../../types";

export default class Pool extends EventEmitter {
  private maxRetries: number;
  private browser: string;
  private config: Capabilities & BrowserConfig;
  private workers: Worker[] = [];
  private queue: { id: string; path: string[]; retries: number }[] = [];
  private forcedStop: boolean = false;
  public get isRunning(): boolean {
    return this.workers.length !== this.freeWorkers.length;
  }
  constructor(config: Config, browser: string) {
    super();

    this.maxRetries = config.maxRetries;
    this.browser = browser;
    this.config = config.browsers[browser];
  }

  init() {
    this.workers = Array.from({ length: this.config.limit }).map(() => {
      cluster.setupMaster({ args: ["--browser", this.browser, ...process.argv.slice(2)] });
      const worker = cluster.fork();
      this.exitHandler(worker);
      return worker;
    });
    // TODO handle errors
    return Promise.all(this.workers.map(worker => new Promise(resolve => worker.once("message", resolve))));
  }

  start(tests: { id: string; path: string[] }[]): boolean {
    if (this.isRunning) return false;

    this.queue = tests.map(({ id, path }) => ({ id, path, retries: 0 }));
    this.process();

    return true;
  }

  stop() {
    // TODO Timeout
    if (!this.isRunning) {
      // TODO this.emit("stop");
      return;
    }

    this.forcedStop = true;
    this.queue = [];
  }

  process() {
    const worker = this.getFreeWorker();
    const [test] = this.queue;

    if (!worker || !test) return;

    const { id } = test;

    this.queue.shift();

    this.sendStatus({ id, status: "running" });

    worker.isRunnning = true;
    worker.once("message", data => {
      const message: WorkerMessage = JSON.parse(data);
      if (message.type == "ready") {
        return;
      }
      const { type, payload } = message;
      const shouldRetry =
        (type == "error" || payload.status == "failed") && test.retries < this.maxRetries && !this.forcedStop;

      if (shouldRetry) {
        test.retries += 1;
        this.queue.push(test);
      }

      if (type == "error") {
        // TODO emit stop event
        this.process();
        return;
      }
      const result = message.payload;
      const { status } = result;

      this.sendStatus({ id, status, result });
      worker.isRunnning = false;

      if (this.queue.length > 0) {
        this.process();
      } else if (this.workers.length === this.freeWorkers.length) {
        this.forcedStop = false;
        this.emit("stop");
      }
    });
    worker.send(JSON.stringify(test));
    this.process();
  }

  private sendStatus(message: { id: string; status: TestStatus; result?: TestResult }) {
    this.emit("test", message);
  }

  private getFreeWorker(): Worker | undefined {
    return this.freeWorkers[Math.floor(Math.random() * this.freeWorkers.length)];
  }

  private get freeWorkers() {
    return this.workers.filter(worker => !worker.isRunnning);
  }

  private exitHandler(worker: Worker) {
    worker.once("exit", () => {
      cluster.setupMaster({ args: ["--browser", this.browser, ...process.argv.slice(2)] });
      const newWorker = cluster.fork();
      this.exitHandler(newWorker);
      // TODO handle errors
      newWorker.once("message", () => {
        this.workers[this.workers.indexOf(worker)] = newWorker;
        this.process();
      });
    });
  }
}
