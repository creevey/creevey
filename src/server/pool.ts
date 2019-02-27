import cluster from "cluster";
import { EventEmitter } from "events";
import { Worker, Config, Test } from "../types";

interface TestQueue extends Test {
  retries: number;
}

export default class Pool extends EventEmitter {
  private browser: string;
  private maxRetries: number;
  private workers: Worker[];
  private queue: TestQueue[] = [];
  constructor(config: Config, browser: string) {
    super();

    const browserConfig = config.browsers[browser];

    this.browser = browser;
    this.maxRetries = config.maxRetries;
    this.workers = Array.from({ length: browserConfig.limit }).map(() =>
      cluster.fork({ browser, config: JSON.stringify(config.browsers[browser]) })
    );
  }

  start(tests: Test[]) {
    this.queue = tests.map(test => ({ ...test, retries: 0 }));
    this.process();
  }

  stop() {
    // TODO clear queue, wait to worker finished
  }

  process() {
    const worker = this.getFreeWorker();
    const [test] = this.queue;

    if (!worker || !test) return;

    this.queue.shift();

    this.emit("message", { test, browser: this.browser, status: "pending" });

    worker.isRunnning = true;
    worker.once("message", message => {
      if (message == "failed") {
        test.retries += 1;
        if (test.retries == this.maxRetries) {
          this.emit("message", { test, browser: this.browser, status: "failed" });
        } else {
          this.emit("message", { test, browser: this.browser, status: "retry" });
          this.queue.push(test);
        }
      }
      if (message == "success") {
        this.emit("message", { test, browser: this.browser, status: "success" });
      }
      worker.isRunnning = false;
      this.process();
    });
    worker.send(JSON.stringify(test));
  }

  getFreeWorker(): Worker | undefined {
    const freeWorkers = this.workers.filter(worker => !worker.isRunnning);

    return freeWorkers[Math.floor(Math.random() * freeWorkers.length)];
  }
}
