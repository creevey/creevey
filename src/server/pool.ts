export default class Pool {
  // TODO retries
  constructor(workers) {
    this.workers = workers;
  }

  addTask(task) {
    this.queue.push(task);
    this.process();
  }

  process() {
    const worker = this.getFreeWorker();

    if (!worker || this.queue.length == 0) return;

    const task = this.queue.pop();

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
      this.freeWorker(worker);
      this.process();
    });
    worker.send(task);
  }

  getFreeWorker() {
    // ???
  }
}
