"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const ws_1 = require("ws");
const url_1 = require("url");
const utils_js_1 = require("../utils.js");
const messages_js_1 = require("../messages.js");
const types_js_1 = require("../../types.js");
const logger_js_1 = require("../logger.js");
const index_js_1 = require("./handlers/index.js");
const tests_handler_js_1 = require("./handlers/tests-handler.js");
function json(handler, defaultValue) {
    return (request, response) => {
        const chunks = [];
        request.on('data', (chunk) => {
            chunks.push(chunk);
        });
        request.on('end', () => {
            try {
                const body = Buffer.concat(chunks);
                const value = body.length === 0 ? defaultValue : JSON.parse(body.toString('utf-8'));
                handler(value);
                response.end();
            }
            catch (error) {
                (0, logger_js_1.logger)().error('Failed to parse JSON', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                response.statusCode = 500;
                response.setHeader('Content-Type', 'text/plain');
                response.end(`Failed to parse JSON: ${errorMessage}`);
            }
        });
        request.on('error', (error) => {
            (0, logger_js_1.logger)().error('Failed to parse JSON', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            response.statusCode = 500;
            response.setHeader('Content-Type', 'text/plain');
            response.end(`Failed to parse JSON: ${errorMessage}`);
        });
    };
}
function file(handler) {
    return (request, response) => {
        const parsedUrl = (0, url_1.parse)(request.url ?? '/', true);
        const requestedPath = decodeURIComponent(parsedUrl.pathname ?? '/');
        try {
            const filePath = handler(requestedPath);
            if (filePath) {
                const stat = fs_1.default.statSync(filePath);
                // Set appropriate MIME type
                const ext = path_1.default.extname(filePath).toLowerCase();
                const mimeTypes = {
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
                const stream = fs_1.default.createReadStream(filePath);
                stream.pipe(response);
                stream.on('error', (error) => {
                    (0, logger_js_1.logger)().error('Error streaming file', error);
                    if (!response.headersSent) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        response.statusCode = 500;
                        response.setHeader('Content-Type', 'text/plain');
                        response.end(`Internal server error: ${errorMessage}`);
                    }
                });
            }
            else {
                (0, logger_js_1.logger)().error('File not found', requestedPath);
                response.statusCode = 404;
                response.setHeader('Content-Type', 'text/plain');
                response.end('File not found');
            }
        }
        catch (error) {
            (0, logger_js_1.logger)().error('Failed to serve file', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            response.statusCode = 500;
            response.setHeader('Content-Type', 'text/plain');
            response.end(`Failed to serve file: ${errorMessage}`);
        }
    };
}
function start(reportDir, port, ui = false, host) {
    let wss = null;
    let creeveyApi = null;
    let resolveApi = types_js_1.noop;
    const webDir = (0, utils_js_1.getClientDir)();
    const server = (0, http_1.createServer)();
    const routes = [
        {
            path: '/ping',
            method: 'GET',
            handler: index_js_1.pingHandler,
        },
        ...(ui
            ? [
                {
                    path: '/tests',
                    method: 'POST',
                    handler: json(tests_handler_js_1.testsHandler, { tests: {} }),
                },
            ]
            : []),
        {
            path: '/stories',
            method: 'POST',
            handler: json(index_js_1.storiesHandler, { stories: [] }),
        },
        {
            path: '/capture',
            method: 'POST',
            handler: json(index_js_1.captureHandler, { workerId: 0, options: undefined }),
        },
        {
            path: '/report/',
            method: 'GET',
            handler: file((0, index_js_1.staticHandler)(reportDir, '/report/')),
        },
        {
            path: '/',
            method: 'GET',
            handler: file((0, index_js_1.staticHandler)(webDir)),
        },
    ];
    const router = (request, response) => {
        const parsedUrl = (0, url_1.parse)(request.url ?? '/', true);
        const path = parsedUrl.pathname ?? '/';
        const method = request.method ?? 'GET';
        try {
            const route = routes.find((route) => path.startsWith(route.path) && route.method === method);
            if (route) {
                route.handler(request, response);
            }
            else {
                response.statusCode = 404;
                response.setHeader('Content-Type', 'text/plain');
                response.end('Not Found');
            }
        }
        catch (error) {
            (0, logger_js_1.logger)().error('Request handling error', error);
            response.statusCode = 500;
            response.setHeader('Content-Type', 'text/plain');
            response.end('Internal Server Error');
        }
    };
    server.on('request', (request, response) => {
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
        wss = new ws_1.WebSocketServer({ server });
        wss.on('connection', (ws) => {
            ws.on('message', (message, isBinary) => {
                if (creeveyApi) {
                    // NOTE Text messages are passed as Buffer https://github.com/websockets/ws/releases/tag/8.0.0
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    creeveyApi.handleMessage(ws, isBinary ? message : message.toString('utf-8'));
                    return;
                }
            });
            ws.on('error', (error) => {
                (0, logger_js_1.logger)().error('WebSocket error', error);
            });
        });
        wss.on('error', (error) => {
            (0, logger_js_1.logger)().error('WebSocket error', error);
        });
    }
    (0, messages_js_1.subscribeOn)('shutdown', () => {
        if (wss) {
            wss.clients.forEach((ws) => {
                ws.close();
            });
            wss.close(() => {
                server.close();
            });
        }
        else {
            server.close();
        }
    });
    server
        .listen(port, host, () => {
        (0, logger_js_1.logger)().info(`Server starting on port ${port}`);
    })
        .on('error', (error) => {
        (0, logger_js_1.logger)().error('Failed to start server', error);
        process.exit(1);
    });
    void new Promise((resolve) => (resolveApi = resolve))
        .then((api) => {
        creeveyApi = api;
        if (wss) {
            creeveyApi.subscribe(wss);
        }
    })
        .catch(utils_js_1.shutdownOnException);
    // Return the function to resolve the API
    return resolveApi;
}
//# sourceMappingURL=server.js.map