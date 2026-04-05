"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitWorkerMessage = emitWorkerMessage;
exports.emitStoriesMessage = emitStoriesMessage;
exports.emitTestMessage = emitTestMessage;
exports.emitShutdownMessage = emitShutdownMessage;
exports.sendStoriesMessage = sendStoriesMessage;
exports.sendTestMessage = sendTestMessage;
exports.sendShutdownMessage = sendShutdownMessage;
exports.sendWorkerMessage = sendWorkerMessage;
exports.subscribeOn = subscribeOn;
exports.subscribeOnWorker = subscribeOnWorker;
const cluster_1 = __importDefault(require("cluster"));
function emitMessage(message) {
    if (cluster_1.default.isWorker && !process.connected)
        return false;
    return (process.send?.(message) ??
        // @ts-expect-error: wrong typings `process.emit` return boolean
        process.emit('message', message));
}
function emitWorkerMessage(message) {
    return emitMessage({ scope: 'worker', ...message });
}
function emitStoriesMessage(message) {
    return emitMessage({ scope: 'stories', ...message });
}
function emitTestMessage(message) {
    return emitMessage({ scope: 'test', ...message });
}
function emitShutdownMessage() {
    return emitMessage({ scope: 'shutdown' });
}
function createHandlers() {
    return Object.assign(Object.create(null), {
        worker: new Set(),
        stories: new Set(),
        test: new Set(),
        shutdown: new Set(),
    });
}
const handlers = createHandlers();
const handler = (message) => {
    switch (message.scope) {
        case 'worker': {
            handlers.worker.forEach((h) => {
                h(message);
            });
            return;
        }
        case 'stories': {
            handlers.stories.forEach((h) => {
                h(message);
            });
            return;
        }
        case 'test': {
            handlers.test.forEach((h) => {
                h(message);
            });
            return;
        }
        case 'shutdown': {
            handlers.shutdown.forEach((h) => {
                h(message);
            });
            return;
        }
    }
};
process.on('message', handler);
function sendStoriesMessage(target, message) {
    target.send?.({ scope: 'stories', ...message });
}
function sendTestMessage(target, message) {
    target.send?.({ scope: 'test', ...message });
}
function sendShutdownMessage(target) {
    target.send?.({ scope: 'shutdown' });
}
function sendWorkerMessage(target, message) {
    target.send?.({ scope: 'worker', ...message });
}
function subscribeOn(scope, handler) {
    switch (scope) {
        case 'worker': {
            const workerHandler = handler;
            handlers.worker.add(workerHandler);
            return () => handlers.worker.delete(workerHandler);
        }
        case 'stories': {
            const storiesHandler = handler;
            handlers.stories.add(storiesHandler);
            return () => handlers.stories.delete(storiesHandler);
        }
        case 'test': {
            const testHandler = handler;
            handlers.test.add(testHandler);
            return () => handlers.test.delete(testHandler);
        }
        case 'shutdown': {
            const shutdownHandler = handler;
            handlers.shutdown.add(shutdownHandler);
            return () => handlers.shutdown.delete(shutdownHandler);
        }
    }
}
const workers = new Map();
function subscribeOnWorker(worker, scope, handler) {
    const workerHandlers = workers.get(worker) ?? createHandlers();
    if (!workers.has(worker)) {
        workers.set(worker, workerHandlers);
        worker.once('exit', () => workers.delete(worker));
        worker.on('message', (message) => {
            switch (message.scope) {
                case 'worker': {
                    workerHandlers.worker.forEach((h) => {
                        h(message);
                    });
                    return;
                }
                case 'stories': {
                    workerHandlers.stories.forEach((h) => {
                        h(message);
                    });
                    return;
                }
                case 'test': {
                    workerHandlers.test.forEach((h) => {
                        h(message);
                    });
                    return;
                }
                case 'shutdown': {
                    workerHandlers.shutdown.forEach((h) => {
                        h(message);
                    });
                    return;
                }
            }
        });
    }
    switch (scope) {
        case 'worker': {
            const workerHandler = handler;
            workerHandlers.worker.add(workerHandler);
            return () => workerHandlers.worker.delete(workerHandler);
        }
        case 'stories': {
            const storiesHandler = handler;
            workerHandlers.stories.add(storiesHandler);
            return () => workerHandlers.stories.delete(storiesHandler);
        }
        case 'test': {
            const testHandler = handler;
            workerHandlers.test.add(testHandler);
            return () => workerHandlers.test.delete(testHandler);
        }
        case 'shutdown': {
            const shutdownHandler = handler;
            workerHandlers.shutdown.add(shutdownHandler);
            return () => workerHandlers.shutdown.delete(shutdownHandler);
        }
    }
}
//# sourceMappingURL=messages.js.map