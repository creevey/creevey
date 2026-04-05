"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreeveyApi = void 0;
const ws_1 = require("ws");
const logger_js_1 = require("../logger.js");
function broadcast(wss, message) {
    wss.clients.forEach((ws) => {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}
function send(ws, message) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
// The class-based implementation of CreeveyApi for native WebSockets
class CreeveyApi {
    runner = null;
    testsManager;
    wss = null;
    constructor(testsManager, runner) {
        this.testsManager = testsManager;
        // Use the provided runner in normal mode, or keep as null in update mode
        if (runner) {
            this.runner = runner;
        }
    }
    subscribe(wss) {
        this.wss = wss;
        // If we have a runner, subscribe to its updates
        if (this.runner) {
            this.runner.on('update', (payload) => {
                this.broadcastUpdate(payload);
            });
        }
        else {
            // Subscribe to TestsManager updates
            this.testsManager.on('update', (update) => {
                this.broadcastUpdate(update);
            });
        }
    }
    handleMessage(ws, message) {
        if (typeof message != 'string') {
            (0, logger_js_1.logger)().info('unhandled message', message);
            return;
        }
        const command = JSON.parse(message);
        if (this.runner) {
            // Normal mode handling with runner
            switch (command.type) {
                case 'status': {
                    const status = this.runner.status;
                    send(ws, { type: 'status', payload: status });
                    return;
                }
                case 'start': {
                    this.runner.start(command.payload);
                    return;
                }
                case 'stop': {
                    this.runner.stop();
                    return;
                }
                case 'approve': {
                    void this.runner.approve(command.payload);
                    return;
                }
                case 'approveAll': {
                    void this.runner.approveAll();
                    return;
                }
            }
        }
        else {
            // In update mode, only approve and approveAll commands are allowed
            switch (command.type) {
                case 'approve': {
                    void this.testsManager.approve(command.payload);
                    return;
                }
                case 'approveAll': {
                    void this.testsManager.approveAll();
                    return;
                }
                case 'status': {
                    // In update mode, respond with static status including tests data
                    send(ws, {
                        type: 'status',
                        payload: {
                            isRunning: false,
                            tests: this.testsManager.getTestsData(),
                            browsers: [],
                            isUpdateMode: true,
                        },
                    });
                    return;
                }
                default: {
                    // Ignore other commands in update mode
                    (0, logger_js_1.logger)().debug(`Command ${command.type} is not available in update mode`);
                    return;
                }
            }
        }
    }
    broadcastUpdate(payload) {
        if (!this.wss)
            return;
        const message = { type: 'update', payload };
        broadcast(this.wss, message);
    }
}
exports.CreeveyApi = CreeveyApi;
//# sourceMappingURL=api.js.map