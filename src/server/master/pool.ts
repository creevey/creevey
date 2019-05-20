import cluster from "cluster";
import { EventEmitter } from "events";
import { Worker, Config, Test, TestResult } from "../../types";

export default class Pool extends EventEmitter {
  private maxRetries: number;
  private workers: Worker[];
  private queue: Test[] = [];
  private forcedStop: boolean = false;
  public get isRunning(): boolean {
    return this.workers.length !== this.freeWorkers.length;
  }
  constructor(config: Config, browser: string) {
    super();

    const browserConfig = config.browsers[browser];

    this.maxRetries = config.maxRetries;
    this.workers = Array.from({ length: browserConfig.limit }).map(() => {
      cluster.setupMaster({ args: ["--browser", browser] });
      return cluster.fork();
    });
  }

  start(tests: { id: string; path: string[] }[]): boolean {
    if (this.isRunning) return false;

    this.queue = tests.map(({ id, path }) => ({ id, path, retries: 0 }));
    this.process();

    return true;
  }

  stop() {
    if (!this.isRunning) return;

    this.forcedStop = true;
    this.queue = [];
  }

  process() {
    const worker = this.getFreeWorker();
    const [test] = this.queue;

    if (!worker || !test) return;

    const { id } = test;

    this.queue.shift();

    this.sendStatus({ id, result: { status: "running" } });

    worker.isRunnning = true;
    worker.once("message", message => {
      // TODO send failed with payload
      const result: TestResult = JSON.parse(message);
      const { status } = result;

      if (status == "failed") {
        const shouldRetry = test.retries < this.maxRetries && !this.forcedStop;
        if (shouldRetry) {
          test.retries += 1;
          this.queue.push(test);
        }
      }
      this.sendStatus({ id, result });
      worker.isRunnning = false;

      if (this.queue.length > 0) {
        this.process();
      } else if (this.workers.length === this.freeWorkers.length) {
        this.forcedStop = false;
        this.emit("stop");
      }
    });
    worker.send(JSON.stringify(test));
  }

  private sendStatus(message: { id: string; result: TestResult }) {
    this.emit("test", message);
  }

  private getFreeWorker(): Worker | undefined {
    return this.freeWorkers[Math.floor(Math.random() * this.freeWorkers.length)];
  }

  private get freeWorkers() {
    return this.workers.filter(worker => !worker.isRunnning);
  }
}
