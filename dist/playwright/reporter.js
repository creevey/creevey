"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const crypto_1 = require("crypto");
const types_js_1 = require("../types.js");
const testsManager_js_1 = require("../server/master/testsManager.js");
const utils_js_1 = require("../server/utils.js");
const assert_1 = __importDefault(require("assert"));
/**
 * Simple async queue to handle operations in sequence without returning promises
 * from reporter methods that should be synchronous
 */
class AsyncQueue {
    queue;
    constructor() {
        this.queue = Promise.resolve();
    }
    /**
     * Add an async operation to the queue
     * @param operation Async operation to execute
     */
    enqueue(operation) {
        this.queue = this.queue.then(operation).catch((error) => {
            console.error(`Error in async queue: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    /**
     * Wait for all operations in the queue to complete
     */
    async waitForCompletion() {
        await this.queue;
    }
}
/**
 * CreeveyPlaywrightReporter is a Playwright reporter that integrates with Creevey
 * to provide visual testing capabilities and use Creevey's UI for reviewing and approving screenshots.
 */
class CreeveyPlaywrightReporter {
    testsManager = null;
    host;
    port;
    debug;
    testIdMap = new Map(); // Maps Playwright test IDs to Creevey test IDs
    asyncQueue = new AsyncQueue();
    abortPoll = null;
    creeveyApiEndpoint = null;
    /**
     * Creates a new instance of the CreeveyPlaywrightReporter
     * @param options Configuration options for the reporter
     */
    constructor(options) {
        this.host = options?.host ?? 'localhost';
        this.port = options?.port ?? 3000;
        this.debug = options?.debug ?? !!process.env.PWDEBUG;
        this.pollCreeveyApi();
    }
    /**
     * Called when the test run starts
     * @param config Playwright configuration
     * @param suite Test suite information
     */
    onBegin(config, suite) {
        this.logDebug('CreeveyPlaywrightReporter started');
        const [snapshotDir, ...restSnapshotDirs] = [...new Set(config.projects.map((project) => project.snapshotDir))];
        const [outputDir, ...restOutputDirs] = [...new Set(config.projects.map((project) => project.outputDir))];
        (0, assert_1.default)(restSnapshotDirs.length === 0, 'Currently multiple snapshot directories are not supported');
        (0, assert_1.default)(restOutputDirs.length === 0, 'Currently multiple output directories are not supported');
        // Initialize TestsManager
        this.testsManager = new testsManager_js_1.TestsManager(snapshotDir, outputDir);
        this.testsManager.on('update', (update) => {
            this.commitTestResults(update);
        });
        // Use the async queue to handle initialization without returning a promise
        this.asyncQueue.enqueue(async () => {
            (0, assert_1.default)(this.testsManager, 'TestsManager is not initialized');
            try {
                await promises_1.default.mkdir(outputDir, { recursive: true });
                await (0, utils_js_1.copyStatics)(outputDir);
            }
            catch (error) {
                this.logError(`Failed to initialize report directory: ${error instanceof Error ? error.message : String(error)}`);
            }
            try {
                const testsList = suite
                    .allTests()
                    .map((test) => {
                    const creeveyTest = this.mapToCreeveyTest(test);
                    if (!creeveyTest)
                        return;
                    this.testIdMap.set(test.id, creeveyTest.id);
                    return creeveyTest;
                })
                    .filter(types_js_1.isDefined);
                const tests = {};
                for (const test of testsList) {
                    tests[test.id] = test;
                }
                this.testsManager.updateTests(tests);
            }
            catch (error) {
                this.logError(`Could not start Creevey server: ${error instanceof Error ? error.message : String(error)}`);
                console.log('Screenshots will still be captured but UI will not be available');
            }
        });
    }
    /**
     * Called when a test begins
     * @param test Test case information
     * @param result Test result (initially empty)
     */
    onTestBegin(test, _result) {
        try {
            (0, assert_1.default)(this.testsManager, 'TestsManager is not initialized');
            const creeveyTestId = this.testIdMap.get(test.id);
            if (creeveyTestId) {
                // Update test status to running
                this.testsManager.updateTestStatus(creeveyTestId, 'running');
                this.logDebug(`Test started: ${test.title} (${creeveyTestId})`);
            }
        }
        catch (error) {
            this.logError(`Error in onTestBegin: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Called when a test step begins
     * @param test Test case information
     * @param result Test result
     * @param step Test step information
     */
    onStepBegin(test, _result, step) {
        /*
        [Creevey Reporter] Step started: browserType.launch in test: 100 X 100 Vs 2000 X 100
        [Creevey Reporter] Step started: browserType.launch in test: Side By Side
        [Creevey Reporter] Step started: browserType.launch in test: Full
        */
        if (this.debug) {
            this.logDebug(`Step started: ${step.title} in test: ${test.title}`);
        }
    }
    /**
     * Called when a test step ends
     * @param test Test case information
     * @param result Test result
     * @param step Test step information
     */
    onStepEnd(_test, _result, step) {
        try {
            // If step has attachments, process them
            if (step.attachments.length > 0) {
                this.logDebug(`Processing ${step.attachments.length} attachments from step: ${step.title}`);
                // We'll process attachments in onTestEnd for simplicity in this initial implementation
            }
        }
        catch (error) {
            this.logError(`Error in onStepEnd: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Called when a test ends
     * @param test Test case information
     * @param result Test result
     */
    onTestEnd(test, result) {
        const creeveyTestId = this.testIdMap.get(test.id);
        // Use the async queue to handle result processing without returning a promise
        this.asyncQueue.enqueue(async () => {
            try {
                // Process test results and screenshots
                await this.processTestResult(test, result);
                if (creeveyTestId) {
                    this.logDebug(`Test ended: ${test.title} (${creeveyTestId}) with status: ${result.status}`);
                }
            }
            catch (error) {
                this.logError(`Error in onTestEnd: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Called when the test run ends
     * @param result The overall test run result
     */
    async onEnd(result) {
        // Use the async queue to handle final operations without returning a promise
        this.asyncQueue.enqueue(async () => {
            try {
                (0, assert_1.default)(this.testsManager, 'TestsManager is not initialized');
                // Save test data
                await this.testsManager.saveTestData();
                this.abortPoll?.();
                this.logDebug(`Test run ended with status: ${result.status}`);
                // TODO: Tell how to run reporter `yarn creevey update ./report --ui`
            }
            catch (error) {
                this.logError(`Error during reporter cleanup: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        // Wait for all previous operations to complete
        await this.asyncQueue.waitForCompletion();
    }
    pollCreeveyApi() {
        const { host, port } = this;
        const setAbort = (fn) => {
            this.abortPoll = fn;
        };
        const setApiEndpoint = (endpoint) => {
            this.creeveyApiEndpoint = endpoint;
        };
        const manager = () => this.testsManager;
        const commit = (update) => {
            this.commitTestResults(update);
        };
        function poll() {
            void Promise.race([
                fetch(`http://${host}:${port}/ping`, {
                    method: 'GET',
                }).then((response) => response.text()),
                new Promise((_, reject) => setTimeout(() => {
                    reject(new Error('Creevey API is not available'));
                }, 1000)),
            ])
                .then((text) => {
                if (text !== 'pong')
                    throw new Error('Creevey API is not available');
                setApiEndpoint(`http://${host}:${port}`);
                const testsManager = manager();
                if (testsManager) {
                    commit({ tests: testsManager.getTestsData() });
                }
            })
                .catch(() => {
                const timeout = setTimeout(poll, 1000);
                setAbort(() => {
                    clearTimeout(timeout);
                });
            });
        }
        poll();
    }
    commitTestResults(update) {
        if (!this.creeveyApiEndpoint)
            return;
        void fetch(`${this.creeveyApiEndpoint}/tests`, {
            method: 'POST',
            body: JSON.stringify(update),
        });
    }
    /**
     * Maps a Playwright test to a Creevey test format
     * @param test Playwright test case
     * @returns Creevey test object or null if mapping fails
     */
    mapToCreeveyTest(test) {
        try {
            const storyName = test.title;
            const storyTitle = test.parent.title;
            const projectName = test.parent.project()?.name ?? 'chromium';
            const testPath = [storyTitle, storyName, projectName];
            const { description: storyId } = test.annotations.find((annotation) => annotation.type === 'storyId') ?? {};
            // Generate a unique test ID
            const testId = (0, crypto_1.createHash)('sha1').update(testPath.join('/')).digest('hex');
            // Create the test metadata
            const testMeta = {
                id: testId,
                storyPath: [...storyTitle.split('/').map((x) => x.trim()), storyName],
                browser: projectName,
                storyId: storyId ?? '',
            };
            // Create a stub ServerTest object
            // This is missing the story and fn properties which would be used in a real Creevey test
            // However, for our reporter purposes, we just need the metadata
            const serverTest = {
                ...testMeta,
                story: {
                    parameters: {},
                    initialArgs: {},
                    argTypes: {},
                    component: '',
                    componentId: '',
                    name: storyName,
                    tags: [],
                    title: storyTitle,
                    kind: storyTitle,
                    id: storyId ?? '',
                    story: storyName,
                }, // Placeholder
                fn: async () => {
                    /* Empty function as placeholder */
                }, // Placeholder
            };
            return serverTest;
        }
        catch (error) {
            this.logError(`Error mapping test to Creevey format: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Process a test result and any attachments
     * @param test Playwright test case
     * @param result Playwright test result
     */
    async processTestResult(test, result) {
        const creeveyTestId = this.testIdMap.get(test.id);
        if (!creeveyTestId) {
            this.logError(`No Creevey test ID found for test: ${test.title}`);
            return Promise.resolve();
        }
        (0, assert_1.default)(this.testsManager, 'TestsManager is not initialized');
        // Determine test status
        let status;
        switch (result.status) {
            case 'passed':
                status = 'success';
                break;
            case 'failed':
            case 'timedOut':
                status = 'failed';
                break;
            default:
                status = 'unknown';
        }
        // Process attachments
        const images = {};
        const attachmentPaths = [];
        const projectName = test.parent.project()?.name ?? 'chromium';
        for (const attachment of result.attachments) {
            const { name, path: attachmentPath } = attachment;
            if (!attachmentPath)
                continue;
            attachmentPaths.push(attachmentPath);
            switch (true) {
                case name.includes('actual'): {
                    images[projectName] = { ...images[projectName], actual: name };
                    break;
                }
                case name.includes('expect'): {
                    images[projectName] = { ...images[projectName], expect: name };
                    break;
                }
                case name.includes('diff'): {
                    images[projectName] = { ...images[projectName], diff: name };
                    break;
                }
            }
        }
        // Update test status and result
        const testResult = {
            status: status === 'success' ? 'success' : 'failed',
            retries: result.retry,
            images,
            error: result.error?.message ?? undefined,
            duration: result.duration,
            attachments: attachmentPaths,
            browserName: projectName,
        };
        this.testsManager.updateTestStatus(creeveyTestId, status, testResult);
    }
    /**
     * Logs a debug message if debug mode is enabled
     * @param message Message to log
     */
    logDebug(message) {
        if (this.debug) {
            console.log(`[Creevey Reporter] ${message}`);
        }
    }
    /**
     * Logs an error message
     * @param message Error message to log
     */
    logError(message) {
        console.error(`[Creevey Reporter] ERROR: ${message}`);
    }
}
exports.default = CreeveyPlaywrightReporter;
//# sourceMappingURL=reporter.js.map