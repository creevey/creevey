import fs from 'fs';
import path from 'path';
import { IncomingMessage, ServerResponse, createServer } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { parse, fileURLToPath, pathToFileURL } from 'url';
import { shutdownOnException } from '../utils.js';
import { subscribeOn } from '../messages.js';
import { noop } from '../../types.js';
import { logger } from '../logger.js';
import { CreeveyApi } from './api.js';
import { pingHandler, captureHandler, storiesHandler, staticHandler } from './handlers/index.js';
import { testsHandler } from './handlers/tests-handler.js';

function json<T = unknown>(
  handler: (data: T) => void,
  defaultValue: T,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request: IncomingMessage, response: ServerResponse) => {
    const chunks: Buffer[] = [];

    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const value = body.length === 0 ? defaultValue : (JSON.parse(body.toString('utf-8')) as T);

        handler(value);
        response.end();
      } catch (error) {
        logger().error('Failed to parse JSON', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        response.statusCode = 500;
        response.setHeader('Content-Type', 'text/plain');
        response.end(`Failed to parse JSON: ${errorMessage}`);
      }
    });

    request.on('error', (error) => {
      logger().error('Failed to parse JSON', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end(`Failed to parse JSON: ${errorMessage}`);
    });
  };
}

function file(handler: (requestedPath: string) => string | undefined) {
  return (request: IncomingMessage, response: ServerResponse) => {
    const parsedUrl = parse(request.url ?? '/', true);
    const requestedPath = decodeURIComponent(parsedUrl.pathname ?? '/');

    try {
      const filePath = handler(requestedPath);
      if (filePath) {
        const stat = fs.statSync(filePath);
        // Set appropriate MIME type
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        response.statusCode = 200;
        response.setHeader('Content-Type', contentType);
        response.setHeader('Content-Length', stat.size);

        // Stream the file
        const stream = fs.createReadStream(filePath);
        stream.pipe(response);

        stream.on('error', (error) => {
          logger().error('Error streaming file', error);
          if (!response.headersSent) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            response.statusCode = 500;
            response.setHeader('Content-Type', 'text/plain');
            response.end(`Internal server error: ${errorMessage}`);
          }
        });
      } else {
        logger().error('File not found', requestedPath);
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/plain');
        response.end('File not found');
      }
    } catch (error) {
      logger().error('Failed to serve file', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end(`Failed to serve file: ${errorMessage}`);
    }
  };
}

const importMetaUrl = pathToFileURL(__filename).href;

export function start(reportDir: string, port: number, ui = false, host?: string): (api: CreeveyApi) => void {
  let wss: WebSocketServer | null = null;
  let creeveyApi: CreeveyApi | null = null;
  let resolveApi: (api: CreeveyApi) => void = noop;

  const webDir = path.join(path.dirname(fileURLToPath(importMetaUrl)), '../../client/web');
  const server = createServer();

  const routes = [
    {
      path: '/ping',
      method: 'GET',
      handler: pingHandler,
    },
    ...(ui
      ? [
          {
            path: '/tests',
            method: 'POST',
            handler: json(testsHandler, { tests: {} }),
          },
        ]
      : []),
    {
      path: '/stories',
      method: 'POST',
      handler: json(storiesHandler, { stories: [] }),
    },
    {
      path: '/capture',
      method: 'POST',
      handler: json(captureHandler, { workerId: 0, options: undefined }),
    },
    {
      path: '/report/',
      method: 'GET',
      handler: file(staticHandler(reportDir, '/report/')),
    },
    {
      path: '/',
      method: 'GET',
      handler: file(staticHandler(webDir)),
    },
  ];

  const router = (request: IncomingMessage, response: ServerResponse): void => {
    const parsedUrl = parse(request.url ?? '/', true);
    const path = parsedUrl.pathname ?? '/';
    const method = request.method ?? 'GET';

    try {
      const route = routes.find((route) => path.startsWith(route.path) && route.method === method);
      if (route) {
        route.handler(request, response);
      } else {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/plain');
        response.end('Not Found');
      }
    } catch (error) {
      logger().error('Request handling error', error);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end('Internal Server Error');
    }
  };

  server.on('request', (request: IncomingMessage, response: ServerResponse): void => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (request.method === 'OPTIONS') {
      response.statusCode = 200;
      response.end();
      return;
    }

    router(request, response);
  });

  if (ui) {
    wss = new WebSocketServer({ server });
    wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: RawData, isBinary: boolean) => {
        if (creeveyApi) {
          // NOTE Text messages are passed as Buffer https://github.com/websockets/ws/releases/tag/8.0.0
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          creeveyApi.handleMessage(ws, isBinary ? message : message.toString('utf-8'));
          return;
        }
      });

      ws.on('error', (error) => {
        logger().error('WebSocket error', error);
      });
    });

    wss.on('error', (error) => {
      logger().error('WebSocket error', error);
    });
  }

  subscribeOn('shutdown', () => {
    if (wss) {
      wss.clients.forEach((ws) => {
        ws.close();
      });
      wss.close(() => {
        server.close();
      });
    } else {
      server.close();
    }
  });

  server
    .listen(port, host, () => {
      logger().info(`Server starting on port ${port}`);
    })
    .on('error', (error: unknown) => {
      logger().error('Failed to start server', error);
      process.exit(1);
    });

  void new Promise<CreeveyApi>((resolve) => (resolveApi = resolve))
    .then((api) => {
      creeveyApi = api;
      if (wss) {
        creeveyApi.subscribe(wss);
      }
    })
    .catch(shutdownOnException);

  // Return the function to resolve the API
  return resolveApi;
}
