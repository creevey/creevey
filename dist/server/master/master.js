"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = master;
const stories_js_1 = require("../stories.js");
const testsManager_js_1 = require("./testsManager.js");
const runner_js_1 = __importDefault(require("./runner.js"));
async function master(config, gridUrl) {
    // Create TestsManager instance
    const testsManager = new testsManager_js_1.TestsManager(config.screenDir, config.reportDir);
    // Create Runner with TestsManager
    const runner = new runner_js_1.default(config, testsManager, gridUrl);
    await runner.init();
    // Load tests from stories and update TestsManager
    const tests = await (0, stories_js_1.loadTestsFromStories)(Object.keys(config.browsers), 
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    (listener) => config.storiesProvider(config, listener), (testsDiff) => {
        runner.updateTests(testsDiff);
    });
    const testsFromReport = testsManager.loadTestsFromReport();
    testsManager.updateTests(testsManager.mergeTests(testsFromReport, tests));
    return runner;
}
//# sourceMappingURL=master.js.map