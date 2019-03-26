import cluster from "cluster";
import { EventEmitter } from "events";
import { Worker, Config, Test } from "../types";

interface TestQueue extends Test {
  retries: number;
}

export default class Pool extends EventEmitter {
  private browser: string;
  private maxRetries: number;
  private isRunnning: boolean = false;
  private isReady: boolean = false;
  private workers: Worker[];
  private queue: TestQueue[] = [];
  constructor(config: Config, browser: string) {
    super();

    const browserConfig = config.browsers[browser];

    this.browser = browser;
    this.maxRetries = config.maxRetries;
    this.workers = Array.from({ length: browserConfig.limit }).map(() => cluster.fork({ browser }));

    this.waitForReady();
  }

  start(tests: Test[]) {
    if (!this.isReady || this.isRunnning) {
      return false;
    }
    this.queue = tests.map(test => ({ ...test, retries: 0 }));
    this.isRunnning = true;
    this.process();

    return true;
  }

  stop() {
    this.isRunnning = false;
    this.isReady = false;
    this.queue = [];
  }

  process() {
    const worker = this.getFreeWorker();
    const browser = this.browser;
    const [test] = this.queue;

    if (!worker || !test) return;

    this.queue.shift();

    this.emit("message", { test, browser, status: "pending" });

    worker.isRunnning = true;
    worker.once("message", message => {
      // TODO send failed with payload
      const { status } = JSON.parse(message);

      if (status == "failed") {
        const shouldRetry = test.retries == this.maxRetries || !this.isRunnning;
        if (shouldRetry) {
          test.retries += 1;
          this.emit("message", { test, browser, status: "retry" });
          this.queue.push(test);
        } else {
          this.emit("message", { test, browser, status });
        }
      }
      if (status == "success") {
        this.emit("message", { test, browser, status });
      }
      worker.isRunnning = false;

      if (this.queue.length > 0) {
        this.process();
      } else if (this.workers.filter(worker => !worker.isRunnning).length == this.workers.length) {
        this.isReady = true;
        this.emit("message", { browser, status: "ready" });
      }
    });
    worker.send(JSON.stringify(test));
  }

  private getFreeWorker(): Worker | undefined {
    const freeWorkers = this.workers.filter(worker => !worker.isRunnning);

    return freeWorkers[Math.floor(Math.random() * freeWorkers.length)];
  }

  private waitForReady() {
    let readyWorkers = 0;
    this.workers.forEach(worker => {
      worker.once("message", message => {
        const { status } = JSON.parse(message);
        if (status != "ready") {
          return;
        }
        readyWorkers += 1;
        if (readyWorkers == this.workers.length) {
          this.isReady = true;
          this.emit("message", { browser: this.browser, status: "ready" });
        }
      });
    });
  }
}
