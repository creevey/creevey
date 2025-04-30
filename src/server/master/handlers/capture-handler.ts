import { Request, Response } from 'hyper-express';
import cluster from 'cluster';
import { subscribeOnWorker, sendStoriesMessage } from '../../messages.js';
import { CaptureOptions, isDefined } from '../../../types.js';

export async function captureHandler(request: Request, response: Response): Promise<void> {
  const { workerId, options } = await request.json<
    { workerId: number; options?: CaptureOptions },
    {
      workerId: number;
      options?: CaptureOptions;
    }
  >({
    workerId: 0,
    options: undefined,
  });

  const worker = Object.values(cluster.workers ?? {})
    .filter(isDefined)
    .find((worker) => worker.process.pid == workerId);

  // NOTE: Hypothetical case when someone send to us capture req and we don't have a worker with browser session for it
  if (!worker) {
    response.send();
    return;
  }

  await new Promise<void>((resolve) => {
    const unsubscribe = subscribeOnWorker(worker, 'stories', (message) => {
      if (message.type != 'capture') return;
      unsubscribe();
      resolve();
    });
    sendStoriesMessage(worker, { type: 'capture', payload: options });
  });

  // TODO Pass screenshot result to show it in inspector
  response.send('Ok');
}
