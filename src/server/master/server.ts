import path from 'path';
import http from 'http';
import Koa from 'koa';
import serve from 'koa-static';
import mount from 'koa-mount';
import WebSocket from 'ws';
import { CreeveyApi } from './api';
import { subscribeOn } from '../messages';
import { noop } from '../../types';
import { logger } from '../logger';

export default function server(reportDir: string, port: number): (api: CreeveyApi) => void {
  let resolveApi: (api: CreeveyApi) => void = noop;
  const creeveyApi = new Promise<CreeveyApi>((resolve) => (resolveApi = resolve));
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  app.use(async (_, next) => {
    await creeveyApi;
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
