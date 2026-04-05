"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestsManager = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const events_1 = __importDefault(require("events"));
const types_js_1 = require("../../types.js");
const utils_js_1 = require("../utils.js");
const promises_1 = require("fs/promises");
/**
 * TestsManager is responsible for all operations related to test data management
 * including loading, saving, merging, and updating test data.
 * It extends EventEmitter to emit update events that can be subscribed to.
 */
class TestsManager extends events_1.default {
    tests = {};
    screenDir;
    reportDir;
    /**
     * Creates a new TestsManager instance
     * @param screenDir Directory for storing reference images
     * @param reportDir Directory for storing reports and screenshots
     */
    constructor(screenDir, reportDir) {
        super();
        this.screenDir = screenDir;
        this.reportDir = reportDir;
    }
    /**
     * Get a copy of all tests
     * @returns all tests
     */
    getTests() {
        return this.tests;
    }
    /**
     * Get a test by ID
     * @param id Test ID
     * @returns Test data
     */
    getTest(id) {
        return this.tests[id];
    }
    /**
     * Get test data in a format suitable for status reporting
     * @returns Test data in the format needed for status
     */
    getTestsData() {
        const testsData = {};
        Object.entries(this.tests).forEach(([id, test]) => {
            if (!test)
                return;
            const { story: _, fn: __, ...testData } = test;
            testsData[id] = testData;
        });
        return testsData;
    }
    /**
     * Load tests from a report file
     */
    loadTestsFromReport() {
        // TODO: Move to utils
        const reportDataPath = path_1.default.join(this.reportDir, 'data.js');
        const testsFromReport = (0, utils_js_1.tryToLoadTestsData)(reportDataPath) ?? {};
        return testsFromReport;
    }
    /**
     * Merge tests from report with tests from stories
     */
    mergeTests(testsWithReports, testsFromStories) {
        Object.values(testsFromStories)
            .filter(types_js_1.isDefined)
            .forEach((test) => {
            const testWithReport = testsWithReports[test.id];
            if (!testWithReport)
                return;
            test.retries = testWithReport.retries;
            if (testWithReport.status === 'success' || testWithReport.status === 'failed') {
                test.status = testWithReport.status;
            }
            test.results = testWithReport.results;
            test.approved = testWithReport.approved;
        });
        return testsFromStories;
    }
    /**
     * Update tests with incremental changes
     * @param testsDiff Tests to update or remove
     */
    updateTests(testsDiff) {
        const tests = {};
        const removedTests = [];
        Object.entries(testsDiff).forEach(([id, newTest]) => {
            if (newTest) {
                if (this.tests[id]) {
                    this.tests[id] = {
                        ...newTest,
                        retries: this.tests[id].retries,
                        results: this.tests[id].results,
                        approved: this.tests[id].approved,
                    };
                }
                else {
                    this.tests[id] = newTest;
                }
                const { story: _, fn: __, ...restTest } = newTest;
                tests[id] = { status: 'unknown', ...restTest };
            }
            else if (this.tests[id]) {
                const { id: testId, browser, testName, storyPath, storyId } = this.tests[id];
                removedTests.push({ id: testId, browser, testName, storyPath, storyId });
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete this.tests[id];
            }
        });
        this.saveTestsToJson();
        const update = { tests, removedTests };
        this.emit('update', update);
        return update;
    }
    /**
     * Update test result
     * @param id Test ID
     * @param status New test status
     * @param result Optional test result
     */
    updateTestStatus(id, status, result) {
        // TODO Handle 'retrying' status
        const test = this.tests[id];
        if (!test)
            return null;
        const { browser, testName, storyPath, storyId } = test;
        test.status = status === 'retrying' ? 'failed' : status;
        if (!result) {
            // NOTE: Running status
            const update = { tests: { [id]: { id, browser, testName, storyPath, status, storyId } } };
            this.emit('update', update);
            return update;
        }
        test.results ??= [];
        test.results.push(result);
        if (status === 'failed') {
            test.approved = null;
        }
        const update = {
            tests: {
                [id]: {
                    id,
                    browser,
                    testName,
                    storyPath,
                    status,
                    approved: test.approved,
                    results: [result],
                    storyId,
                },
            },
        };
        this.emit('update', update);
        return update;
    }
    /**
     * Save tests to JSON file
     * @param reportDir Directory to save the JSON file
     */
    saveTestsToJson() {
        (0, fs_1.mkdirSync)(this.reportDir, { recursive: true });
        (0, fs_1.writeFileSync)(path_1.default.join(this.reportDir, 'tests.json'), 
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        JSON.stringify(this.tests, (_, value) => ((0, types_js_1.isFunction)(value) ? value.toString() : value), 2));
    }
    /**
     * Save test data to a module
     * @param data Test data to include in the module
     */
    async saveTestData(data = this.getTestsData()) {
        const dataModule = `
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.__CREEVEY_DATA__ = factory();
  }
}(this, function () { return ${JSON.stringify(data)} }));
`;
        await (0, promises_1.writeFile)(path_1.default.join(this.reportDir, 'data.js'), dataModule);
    }
    /**
     * Copy image for approval
     * @param test Test data
     * @param image Image name
     * @param actual Actual image path
     */
    async copyImage(test, image, actual) {
        const { browser, testName, storyPath } = test;
        const restPath = [...storyPath, testName].filter(types_js_1.isDefined);
        const testPath = path_1.default.join(...restPath, image == browser ? '' : browser);
        const srcImagePath = path_1.default.join(this.reportDir, testPath, actual);
        const dstImagePath = path_1.default.join(this.screenDir, testPath, `${image}.png`);
        await (0, promises_1.mkdir)(path_1.default.join(this.screenDir, testPath), { recursive: true });
        await (0, promises_1.copyFile)(srcImagePath, dstImagePath);
    }
    /**
     * Approve a specific test
     * @param payload Approval payload with test ID, retry index, and image name
     */
    async approve({ id, retry, image }) {
        const test = this.tests[id];
        if (!test?.results)
            return null;
        const result = test.results[retry];
        if (!result.images)
            return null;
        const images = result.images[image];
        if (!images)
            return null;
        test.approved ??= {};
        const { browser, testName, storyPath, storyId } = test;
        await this.copyImage(test, image, images.actual);
        test.approved[image] = retry;
        if (Object.keys(result.images).every((name) => typeof test.approved?.[name] == 'number')) {
            test.status = 'approved';
        }
        const update = {
            tests: {
                [id]: {
                    id,
                    browser,
                    testName,
                    storyPath,
                    status: test.status,
                    approved: test.approved,
                    storyId,
                },
            },
        };
        this.emit('update', update);
        return update;
    }
    /**
     * Approve all failed tests
     */
    async approveAll() {
        const updatedTests = {};
        for (const test of Object.values(this.tests)) {
            if (!test?.results)
                continue;
            const retry = test.results.length - 1;
            const { images, status } = test.results.at(retry) ?? {};
            if (!images || status != 'failed')
                continue;
            for (const [name, image] of Object.entries(images)) {
                if (!image)
                    continue;
                await this.copyImage(test, name, image.actual);
                test.approved ??= {};
                test.approved[name] = retry;
                test.status = 'approved';
                updatedTests[test.id] = {
                    id: test.id,
                    browser: test.browser,
                    storyPath: test.storyPath,
                    storyId: test.storyId,
                    status: test.status,
                    approved: { [name]: retry },
                };
            }
        }
        const result = { tests: updatedTests };
        this.emit('update', result);
        return result;
    }
}
exports.TestsManager = TestsManager;
//# sourceMappingURL=testsManager.js.map