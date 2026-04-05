"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingHandler = pingHandler;
function pingHandler(_request, response) {
    response.setHeader('Content-Type', 'text/plain');
    response.end('pong');
}
//# sourceMappingURL=ping-handler.js.map