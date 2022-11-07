import path from 'path';
import http from 'http';
import cluster from 'cluster';
import Koa from 'koa';
import cors from '@koa/cors';
import serve from 'koa-static';
import mount from 'koa-mount';
import body from 'koa-bodyparser';
import WebSocket from 'ws';
import { CreeveyApi } from './api';
import { emitStoriesMessage, sendStoriesMessage, subscribeOn, subscribeOnWorker } from '../messages';
import { CaptureOptions, isDefined, noop, StoryInput } from '../../types';
import { logger } from '../logger';
import { deserializeStory } from '../../shared';

export default function server(reportDir: string, port: number, ui: boolean): (api: CreeveyApi) => void {
  let resolveApi: (api: CreeveyApi) => void = noop;
  let setStoriesCounter = 0;
  const creeveyApi = new Promise<CreeveyApi>((resolve) => (resolveApi = resolve));
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  app.use(cors());
  app.use(body());

  app.use(async (ctx, next) => {
    if (ctx.method == 'GET' && ctx.path == '/ping') {
      ctx.body = 'pong';
      return;
    }
    await next();
  });

  if (ui) {
    app.use(async (_, next) => {
      await creeveyApi;
      await next();
    });
  }

  app.use(async (ctx, next) => {
    if (ctx.method == 'POST' && ctx.path == '/stories') {
      const { setStoriesCounter: counter, stories } = ctx.request.body as {
        setStoriesCounter: number;
        stories: [string, StoryInput[]][];
      };
      if (setStoriesCounter >= counter) return;

      const deserializedStories = stories.map<[string, StoryInput[]]>(([file, stories]) => [
        file,
        stories.map(deserializeStory),
      ]);

      setStoriesCounter = counter;
      emitStoriesMessage({ type: 'update', payload: deserializedStories });
      Object.values(cluster.workers ?? {})
        .filter(isDefined)
        .filter((worker) => worker.isConnected())
        .forEach((worker) => sendStoriesMessage(worker, { type: 'update', payload: deserializedStories }));
      return;
    }
    await next();
  });

  app.use(async (ctx, next) => {
    if (ctx.method == 'POST' && ctx.path == '/capture') {
      const { workerId, options } = ctx.request.body as { workerId: number; options?: CaptureOptions };
      const worker = Object.values(cluster.workers ?? {})
        .filter(isDefined)
        .find((worker) => worker.process.pid == workerId);
      // NOTE: Hypothetical case when someone send to us capture req and we don't have a worker with browser session for it
      if (!worker) return;
      await new Promise<void>((resolve) => {
        const unsubscribe = subscribeOnWorker(worker, 'stories', (message) => {
          if (message.type != 'capture') return;
          unsubscribe();
          resolve();
        });
        sendStoriesMessage(worker, { type: 'capture', payload: options });
      });
      // TODO Pass screenshot result to show it in inspector
      ctx.body = 'Ok';
      return;
    }
    await next();
  });

  app.use(serve(path.join(__dirname, '../../client/web')));
  app.use(mount('/report', serve(reportDir)));

  wss.on('error', (error) => logger.error(error));

  server.listen(port);

  subscribeOn('shutdown', () => {
    server.close();
    wss.close();
  });

  void creeveyApi.then((api) => {
    api.subscribe(wss);

    wss.on('connection', (ws) => {
      ws.on('message', (message: WebSocket.Data) => api.handleMessage(ws, message));
    });
  });

  return resolveApi;
}
