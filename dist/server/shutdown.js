"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const messages_js_1 = require("./messages.js");
const utils_js_1 = require("./utils.js");
if (cluster_1.default.isWorker) {
    (0, messages_js_1.subscribeOn)('shutdown', () => {
        utils_js_1.isShuttingDown.current = true;
    });
}
process.on('uncaughtException', utils_js_1.shutdownOnException);
process.on('unhandledRejection', utils_js_1.shutdownOnException);
// TODO SIGINT Stuck with selenium
process.on('SIGINT', () => {
    if (utils_js_1.isShuttingDown.current) {
        process.exit(-1);
    }
    utils_js_1.isShuttingDown.current = true;
});
//# sourceMappingURL=shutdown.js.map