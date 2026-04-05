"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerQueue = void 0;
const cluster_1 = __importDefault(require("cluster"));
const types_js_1 = require("../../types.js");
const utils_js_1 = require("../utils.js");
const FORK_RETRIES = 5;
class WorkerQueue {
    useQueue;
    isProcessing = false;
    queue = [];
    // TODO Add concurrency
    constructor(useQueue) {
        this.useQueue = useQueue;
    }
    async forkWorker(browser, storybookUrl, gridUrl, retry = 0) {
        return new Promise((resolve) => {
            this.queue.push({ browser, storybookUrl, gridUrl, retry, resolve });
            void this.process();
        });
    }
    async process() {
        if (this.useQueue && this.isProcessing)
            return;
        const { browser, storybookUrl, gridUrl, retry, resolve } = this.queue.pop() ?? {};
        if (browser == undefined || storybookUrl == undefined || retry == undefined || resolve == undefined)
            return;
        if (utils_js_1.isShuttingDown.current) {
            resolve({ error: 'Master process is shutting down' });
            return;
        }
        this.isProcessing = true;
        cluster_1.default.setupPrimary({
            args: [
                'worker',
                '--browser',
                browser,
                ...(gridUrl ? ['--gridUrl', gridUrl] : []),
                ...process.argv.slice(3),
                '--storybookUrl',
                storybookUrl,
            ],
        });
        const worker = cluster_1.default.fork();
        const message = await new Promise((resolve) => {
            const readyHandler = (message) => {
                if (!(0, types_js_1.isWorkerMessage)(message) || message.type == 'port')
                    return;
                worker.off('message', readyHandler);
                resolve(message);
            };
            worker.on('message', readyHandler);
        });
        if (message.type == 'error') {
            (0, utils_js_1.gracefullyKill)(worker);
            if (retry == FORK_RETRIES)
                resolve(message.payload);
            else
                this.queue.push({ browser, storybookUrl, gridUrl, retry: retry + 1, resolve });
        }
        else {
            resolve(worker);
        }
        this.isProcessing = false;
        setImmediate(() => void this.process());
    }
}
exports.WorkerQueue = WorkerQueue;
//# sourceMappingURL=queue.js.map