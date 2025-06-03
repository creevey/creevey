import cluster from 'cluster';
import { subscribeOnWorker, sendStoriesMessage } from '../../messages.js';
import { CaptureOptions, isDefined } from '../../../types.js';

export function captureHandler({ workerId, options }: { workerId: number; options?: CaptureOptions }): void {
  const worker = Object.values(cluster.workers ?? {})
    .filter(isDefined)
    .find((worker) => worker.process.pid == workerId);

  // NOTE: Hypothetical case when someone send to us capture req and we don't have a worker with browser session for it
  if (!worker) {
    return;
  }

  const unsubscribe = subscribeOnWorker(worker, 'stories', (message) => {
    if (message.type != 'capture') return;
    unsubscribe();
  });
  sendStoriesMessage(worker, { type: 'capture', payload: options });
}
