import path from 'path';
import HyperExpress from 'hyper-express';
import { fileURLToPath, pathToFileURL } from 'url';
import { CreeveyApi } from './api.js';
import { subscribeOn } from '../messages.js';
import { noop } from '../../types.js';
import { logger } from '../logger.js';
import { pingHandler, createStoriesHandler, captureHandler, createStaticFileHandler } from './handlers/index.js';

const importMetaUrl = pathToFileURL(__filename).href;

export function start(reportDir: string, port: number, ui: boolean): (api: CreeveyApi) => void {
  let resolveApi: (api: CreeveyApi) => void = noop;
  const creeveyApi = new Promise<CreeveyApi>((resolve) => (resolveApi = resolve));

  // Create HyperExpress server instance
  const server = new HyperExpress.Server();

  // Store active WebSocket connections
  const activeConnections = new Set<HyperExpress.Websocket>();

  // Enable CORS for all routes
  server.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (request.method === 'OPTIONS') {
      return response.status(200).send();
    }

    next();
  });

  // Health check endpoint
  server.get('/ping', pingHandler);

  // Stories endpoint
  server.post('/stories', createStoriesHandler());

  // Capture endpoint
  server.post('/capture', captureHandler);

  // Serve static files
  const webDir = path.join(path.dirname(fileURLToPath(importMetaUrl)), '../../client/web');
  server.get('/*', createStaticFileHandler(webDir));

  // Serve report files
  server.get('/report/*', createStaticFileHandler(reportDir, '/report/'));

  // If UI mode, wait for CreeveyApi to be resolved
  if (ui) {
    // Create a custom broadcast function that works with our connections
    const broadcast = (message: string) => {
      for (const connection of activeConnections) {
        connection.send(message);
      }
    };

    // Create a custom WebSocket server that simulates the standard behavior
    const customWsServer = {
      clients: activeConnections,
      publish: broadcast,
    };

    let api: CreeveyApi | null = null;

    server.use(async (request, _response, next) => {
      if (!api && request.path === '/') {
        api = await creeveyApi;
        api.subscribe(customWsServer);
      }
      next();
    });

    // Create WebSocket listener
    server.ws('/', (ws) => {
      // Add connection to the set of active connections
      activeConnections.add(ws);

      // Handle message events
      ws.on('message', (message: string | Buffer) => {
        api?.handleMessage(ws, message);
      });

      // Handle close events to clean up connections
      ws.on('close', () => {
        activeConnections.delete(ws);
      });
    });
  }

  // Shutdown handling
  subscribeOn('shutdown', () => {
    // Close all WebSocket connections
    for (const connection of activeConnections) {
      try {
        connection.close();
      } catch (error) {
        logger().error('Error closing WebSocket connection', error);
      }
    }

    // Close the server
    server.close();
  });

  // Start server
  server
    .listen(port)
    .then(() => {
      logger().info(`Server starting on port ${port}`);
    })
    .catch((error: unknown) => {
      logger().error('Failed to start server', error);
      process.exit(1);
    });

  // Return the function to resolve the API
  return resolveApi;
}
