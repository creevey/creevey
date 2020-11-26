import path from 'path';
import http from 'http';
import Koa from 'koa';
import serve from 'koa-static';
import mount from 'koa-mount';
import WebSocket from 'ws';
import { CreeveyApi } from './api';
import { subscribeOn } from '../messages';

export default function server(api: CreeveyApi, reportDir: string, port: number): void {
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server, noServer: true });

  app.use(serve(path.join(__dirname, '../../client/web')));
  app.use(mount('/report', serve(reportDir)));

  api.subscribe(wss);

  wss.on('connection', (ws) => {
    console.log('[WebSocketServer]:', 'Connection open');

    ws.on('error', (error) => console.log('[WebSocket]:', error));
    ws.on('open', () => console.log('[WebSocket]:', 'Connection open'));
    ws.on('close', () => console.log('[WebSocket]:', 'Connection close'));
    ws.on('message', (message: WebSocket.Data) => api.handleMessage(ws, message));
  });

  wss.on('error', (error) => console.log('[WebSocketServer]:', error));

  server.listen(port, () => console.log('[CreeveyServer]:', `Started on http://localhost:${port}`));

  subscribeOn('shutdown', () => {
    server.close();
    wss.close();
  });
}
