import cluster from "cluster";
import { EventEmitter } from "events";
import Task from "./task";
import { Worker, Config, Test } from "../types";

export default class Pool extends EventEmitter {
  private maxRetries: number;
  private workers: Worker[];
  private queue: Task[] = [];
  constructor(config: Config, browser: string) {
    super();

    const browserConfig = config.browsers[browser];

    this.maxRetries = config.maxRetries;
    this.workers = Array.from({ length: browserConfig.limit }).map(() =>
      cluster.fork({ browser, config: JSON.stringify(config.browsers[browser]) })
    );
  }

  startTests(tests: Test[]) {}

  addTask(task: Task) {
    this.queue.push(task);
    this.process();
  }

  process() {
    const worker = this.getFreeWorker();
    const [task] = this.queue;

    if (!worker || !task) return;

    this.queue.shift();

    task.pending();
    worker.isRunnning = true;
    worker.once("message", message => {
      if (message == "failed") {
        task.retries += 1;
        if (task.retries == this.maxRetries) {
          task.failed();
        } else {
          task.retry();
          this.queue.push(task);
        }
      }
      if (message == "success") {
        task.success();
      }
      worker.isRunnning = false;
      this.process();
    });
    worker.send(task.payload);
  }

  getFreeWorker(): Worker | undefined {
    const freeWorkers = this.workers.filter(worker => !worker.isRunnning);

    return freeWorkers[Math.floor(Math.random() * freeWorkers.length)];
  }
}
