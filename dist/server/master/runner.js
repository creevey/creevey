"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const types_js_1 = require("../../types.js");
const pool_js_1 = __importDefault(require("./pool.js"));
const queue_js_1 = require("./queue.js");
const utils_js_1 = require("../utils.js");
const index_js_1 = require("../reporters/index.js");
// NOTE: This is workaround to fix parallel tests running with mocha-junit-reporter
let isJUnit = false;
class FakeRunner extends events_1.EventEmitter {
    stats = {
        duration: 0,
        failures: 0,
        pending: 0,
    };
}
class Runner extends events_1.EventEmitter {
    failFast;
    browsers;
    scheduler;
    pools = {};
    fakeRunner;
    config;
    testsManager;
    get isRunning() {
        return Object.values(this.pools).some((pool) => pool.isRunning);
    }
    constructor(config, testsManager, gridUrl) {
        super();
        this.config = config;
        this.failFast = config.failFast;
        this.testsManager = testsManager;
        this.scheduler = new queue_js_1.WorkerQueue(config.useWorkerQueue);
        this.browsers = Object.keys(config.browsers);
        const runner = new FakeRunner();
        const Reporter = (0, index_js_1.getReporter)(config.reporter);
        if (Reporter.name == 'MochaJUnitReporter') {
            isJUnit = true;
        }
        new Reporter(runner, { reportDir: config.reportDir, reporterOptions: config.reporterOptions });
        this.fakeRunner = runner;
        this.browsers
            .map((browser) => (this.pools[browser] = new pool_js_1.default(this.scheduler, config, browser, gridUrl)))
            .map((pool) => pool.on('test', this.handlePoolMessage));
    }
    handlePoolMessage = (message) => {
        const { id, workerId, status, result } = message;
        const test = this.testsManager.getTest(id);
        if (!test)
            return;
        const { browser, testName } = test;
        const fakeSuite = {
            title: test.storyPath.slice(0, -1).join('/'),
            fullTitle: () => fakeSuite.title,
            titlePath: () => [fakeSuite.title],
            tests: [],
        };
        const fakeTest = {
            parent: fakeSuite,
            title: [test.story.name, testName, browser].filter(types_js_1.isDefined).join('/'),
            fullTitle: () => (0, utils_js_1.getTestPath)(test).join('/'),
            titlePath: () => (0, utils_js_1.getTestPath)(test),
            currentRetry: () => result?.retries,
            retires: () => this.config.maxRetries,
            slow: () => 1000,
            err: result?.error,
            creevey: {
                testId: id,
                workerId,
                sessionId: result?.sessionId ?? id,
                browserName: result?.browserName ?? browser,
                willRetry: (result?.retries ?? 0) < this.config.maxRetries,
                images: result?.images ?? {},
            },
        };
        fakeSuite.tests.push(fakeTest);
        const update = this.testsManager.updateTestStatus(id, status, result);
        if (!update)
            return;
        if (!result) {
            this.fakeRunner.emit(types_js_1.TEST_EVENTS.TEST_BEGIN, fakeTest);
            this.sendUpdate(update);
            return;
        }
        const { duration, attachments } = result;
        fakeTest.duration = duration;
        fakeTest.attachments = attachments;
        fakeTest.state = result.status === 'failed' ? 'failed' : 'passed';
        if (duration !== undefined) {
            fakeTest.speed = duration > fakeTest.slow() ? 'slow' : duration / 2 > fakeTest.slow() ? 'medium' : 'fast';
        }
        if (isJUnit) {
            this.fakeRunner.emit(types_js_1.TEST_EVENTS.SUITE_BEGIN, fakeSuite);
        }
        if (result.status === 'failed') {
            fakeTest.err = result.error;
            this.fakeRunner.emit(types_js_1.TEST_EVENTS.TEST_FAIL, fakeTest, result.error);
            this.fakeRunner.stats.failures++;
        }
        else {
            this.fakeRunner.emit(types_js_1.TEST_EVENTS.TEST_PASS, fakeTest);
            this.fakeRunner.stats.duration += duration ?? 0;
        }
        if (isJUnit) {
            this.fakeRunner.emit(types_js_1.TEST_EVENTS.SUITE_END, fakeSuite);
        }
        this.fakeRunner.emit(types_js_1.TEST_EVENTS.TEST_END, fakeTest);
        this.sendUpdate(update);
        if (this.failFast && status == 'failed')
            this.stop();
    };
    handlePoolStop = () => {
        if (!this.isRunning) {
            this.fakeRunner.emit(types_js_1.TEST_EVENTS.RUN_END);
            this.sendUpdate({ isRunning: false });
            this.emit('stop');
        }
    };
    async init() {
        await Promise.all(Object.values(this.pools).map((pool) => pool.init()));
    }
    updateTests(testsDiff) {
        const update = this.testsManager.updateTests(testsDiff);
        if (update)
            this.sendUpdate(update);
    }
    start(ids) {
        if (this.isRunning)
            return;
        const testsToStart = ids
            .map((id) => this.testsManager.getTest(id))
            .filter(types_js_1.isDefined)
            .filter((test) => !test.skip);
        if (testsToStart.length == 0)
            return;
        const pendingTests = testsToStart.reduce((update, { id, storyId, browser, testName, storyPath }) => ({
            ...update,
            [id]: { id, browser, testName, storyPath, status: 'pending', storyId },
        }), {});
        this.sendUpdate({
            isRunning: true,
            tests: pendingTests,
        });
        const testsByBrowser = testsToStart.reduce((tests, test) => {
            const { id, browser, testName, storyPath } = test;
            const restPath = [...storyPath, testName].filter(types_js_1.isDefined);
            // Update status to pending in TestsManager
            this.testsManager.updateTestStatus(id, 'pending');
            return {
                ...tests,
                [browser]: [...(tests[browser] ?? []), { id, path: restPath }],
            };
        }, {});
        this.fakeRunner.emit(types_js_1.TEST_EVENTS.RUN_BEGIN);
        this.browsers.forEach((browser) => {
            const pool = this.pools[browser];
            const tests = testsByBrowser[browser];
            if (tests && tests.length > 0 && pool.start(tests)) {
                pool.once('stop', this.handlePoolStop);
            }
        });
    }
    stop() {
        if (!this.isRunning)
            return;
        this.browsers.forEach((browser) => {
            this.pools[browser].stop();
        });
    }
    get status() {
        return {
            isRunning: this.isRunning,
            tests: this.testsManager.getTestsData(),
            browsers: this.browsers,
            isUpdateMode: false,
        };
    }
    async approveAll() {
        const update = await this.testsManager.approveAll();
        this.sendUpdate(update);
    }
    async approve(payload) {
        const update = await this.testsManager.approve(payload);
        if (update)
            this.sendUpdate(update);
    }
    sendUpdate(data) {
        this.emit('update', data);
    }
}
exports.default = Runner;
//# sourceMappingURL=runner.js.map