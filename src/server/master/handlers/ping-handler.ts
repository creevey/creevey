import { IncomingMessage, ServerResponse } from 'http';

export function pingHandler(_request: IncomingMessage, response: ServerResponse): void {
  response.setHeader('Content-Type', 'text/plain');
  response.end('pong');
}
