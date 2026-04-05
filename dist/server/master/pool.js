"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = require("cluster");
const events_1 = require("events");
const messages_js_1 = require("../messages.js");
const utils_js_1 = require("../utils.js");
class Pool extends events_1.EventEmitter {
    scheduler;
    browser;
    maxRetries;
    config;
    workers = [];
    queue = [];
    forcedStop = false;
    failFast;
    gridUrl;
    storybookUrl;
    get isRunning() {
        return this.workers.length !== this.freeWorkers.length;
    }
    constructor(scheduler, config, browser, gridUrl) {
        super();
        this.scheduler = scheduler;
        this.browser = browser;
        this.failFast = config.failFast;
        this.maxRetries = config.maxRetries;
        this.config = config.browsers[browser];
        this.gridUrl = this.config.gridUrl ?? gridUrl;
        this.storybookUrl = this.config.storybookUrl ?? config.storybookUrl;
    }
    async init() {
        const poolSize = Math.max(1, this.config.limit ?? 1);
        this.workers = (await Promise.all(Array.from({ length: poolSize }).map(() => this.scheduler.forkWorker(this.browser, this.storybookUrl, this.gridUrl)))).filter((workerOrError) => workerOrError instanceof cluster_1.Worker);
        if (this.workers.length != poolSize)
            throw new Error(`Can't instantiate workers for ${this.browser} due many errors`);
        this.workers.forEach((worker) => {
            this.exitHandler(worker);
        });
    }
    start(tests) {
        if (this.isRunning)
            return false;
        this.queue = tests.map(({ id, path }) => ({ id, path, retries: 0 }));
        this.process();
        return true;
    }
    stop() {
        if (!this.isRunning) {
            this.emit('stop');
            return;
        }
        this.forcedStop = true;
        this.queue = [];
    }
    process() {
        const worker = this.getFreeWorker();
        const test = this.queue.at(0);
        if (this.queue.length == 0 && this.workers.length === this.freeWorkers.length) {
            this.forcedStop = false;
            this.emit('stop');
            return;
        }
        if (!worker || !test)
            return;
        worker.isRunning = true;
        const { id } = test;
        this.queue.shift();
        this.sendStatus({ id, workerId: worker.id, status: 'running' });
        this.subscribe(worker, test);
        (0, messages_js_1.sendTestMessage)(worker, { type: 'start', payload: test });
        setImmediate(() => {
            this.process();
        });
    }
    sendStatus(message) {
        this.emit('test', message);
    }
    getFreeWorker() {
        const freeWorkers = this.freeWorkers;
        return freeWorkers[Math.floor(Math.random() * freeWorkers.length)];
    }
    get aliveWorkers() {
        return this.workers.filter((worker) => !worker.exitedAfterDisconnect && !worker.isShuttingDown);
    }
    get freeWorkers() {
        return this.aliveWorkers.filter((worker) => !worker.isRunning);
    }
    exitHandler(worker) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        worker.once('exit', async () => {
            if (utils_js_1.isShuttingDown.current)
                return;
            const workerOrError = await this.scheduler.forkWorker(this.browser, this.storybookUrl, this.gridUrl);
            if (!(workerOrError instanceof cluster_1.Worker))
                throw new Error(`Can't instantiate worker for ${this.browser} due many errors`);
            this.exitHandler(workerOrError);
            this.workers[this.workers.indexOf(worker)] = workerOrError;
            this.process();
        });
    }
    shouldRetry(test) {
        return test.retries < this.maxRetries && !this.forcedStop;
    }
    handleTestResult(worker, test, result) {
        const shouldRetry = result.status == 'failed' && this.shouldRetry(test);
        if (shouldRetry) {
            test.retries += 1;
            this.queue[this.failFast ? 'unshift' : 'push'](test);
        }
        this.sendStatus({ id: test.id, workerId: worker.id, status: shouldRetry ? 'retrying' : result.status, result });
        worker.isRunning = false;
        setImmediate(() => {
            this.process();
        });
    }
    subscribe(worker, test) {
        const subscriptions = [
            (0, messages_js_1.subscribeOnWorker)(worker, 'worker', (message) => {
                if (message.type != 'error')
                    return;
                subscriptions.forEach((unsubscribe) => {
                    unsubscribe();
                });
                if (message.payload.subtype == 'unknown') {
                    (0, utils_js_1.gracefullyKill)(worker);
                }
                this.handleTestResult(worker, test, { status: 'failed', error: message.payload.error, retries: test.retries });
            }),
            (0, messages_js_1.subscribeOnWorker)(worker, 'test', (message) => {
                if (message.type != 'end')
                    return;
                subscriptions.forEach((unsubscribe) => {
                    unsubscribe();
                });
                this.handleTestResult(worker, test, message.payload);
            }),
        ];
    }
}
exports.default = Pool;
//# sourceMappingURL=pool.js.map