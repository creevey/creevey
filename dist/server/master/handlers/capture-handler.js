"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureHandler = captureHandler;
const cluster_1 = __importDefault(require("cluster"));
const messages_js_1 = require("../../messages.js");
const types_js_1 = require("../../../types.js");
function captureHandler({ workerId, options }) {
    const worker = Object.values(cluster_1.default.workers ?? {})
        .filter(types_js_1.isDefined)
        .find((worker) => worker.process.pid == workerId);
    // NOTE: Hypothetical case when someone send to us capture req and we don't have a worker with browser session for it
    if (!worker) {
        return;
    }
    const unsubscribe = (0, messages_js_1.subscribeOnWorker)(worker, 'stories', (message) => {
        if (message.type != 'capture')
            return;
        unsubscribe();
    });
    (0, messages_js_1.sendStoriesMessage)(worker, { type: 'capture', payload: options });
}
//# sourceMappingURL=capture-handler.js.map