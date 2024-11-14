import cluster from 'cluster';
import { isWorkerMessage, Worker, WorkerMessage } from '../../types.js';
import { gracefullyKill, isShuttingDown } from '../utils.js';

const FORK_RETRIES = 5;

type MaybeWorker = Worker | { error: string };

export class WorkerQueue {
  private isProcessing = false;
  private queue: { browser: string; gridUrl?: string; retry: number; resolve: (mw: MaybeWorker) => void }[] = [];

  // TODO Add concurrency
  constructor(private useQueue: boolean) {}

  async forkWorker(browser: string, gridUrl?: string, retry = 0): Promise<MaybeWorker> {
    return new Promise<MaybeWorker>((resolve) => {
      this.queue.push({ browser, gridUrl, retry, resolve });

      void this.process();
    });
  }

  private async process() {
    if ((this.useQueue && this.isProcessing) || isShuttingDown.current) return;

    const { browser, gridUrl, retry, resolve } = this.queue.pop() ?? {};

    if (browser == undefined || retry == undefined || resolve == undefined) return;

    this.isProcessing = true;

    cluster.setupPrimary({
      args: ['--browser', browser, ...(gridUrl ? ['--gridUrl', gridUrl] : []), ...process.argv.slice(2)],
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

    if (message.type == 'error') {
      gracefullyKill(worker);

      if (retry == FORK_RETRIES) resolve(message.payload);
      else this.queue.push({ browser, gridUrl, retry: retry + 1, resolve });
    } else {
      resolve(worker);
    }

    this.isProcessing = false;

    setImmediate(() => void this.process());
  }
}
