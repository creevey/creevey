"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const master_js_1 = __importDefault(require("./master.js"));
const api_js_1 = require("./api.js");
const types_js_1 = require("../../types.js");
const utils_js_1 = require("../utils.js");
const messages_js_1 = require("../messages.js");
const logger_js_1 = require("../logger.js");
const telemetry_js_1 = require("../telemetry.js");
const server_js_1 = require("./server.js");
const chalk_1 = __importDefault(require("chalk"));
async function outputUnnecessaryImages(imagesDir, reportDir, images) {
    if (!(0, fs_1.existsSync)(imagesDir))
        return;
    const unnecessaryImages = (0, utils_js_1.readDirRecursive)(imagesDir)
        .map((imagePath) => path_1.default.posix.relative(imagesDir, imagePath))
        .filter((imagePath) => !images.has(imagePath));
    if (unnecessaryImages.length > 0) {
        const filePath = path_1.default.join(reportDir, 'unnecessary-images.txt');
        const content = unnecessaryImages.join('\\n');
        await (0, promises_1.writeFile)(filePath, content);
    }
}
async function outputSummary(runner, config, options) {
    const tests = Object.values(runner.status.tests);
    const isSuccess = tests
        .filter(types_js_1.isDefined)
        .filter(({ skip }) => !skip)
        .every(({ status }) => status == 'success');
    const total = tests.filter(types_js_1.isDefined).length;
    const skipped = tests.filter(types_js_1.isDefined).filter((t) => t.skip).length;
    const passed = tests.filter(types_js_1.isDefined).filter((t) => !t.skip && t.status === 'success').length;
    const failed = tests.filter(types_js_1.isDefined).filter((t) => !t.skip && t.status === 'failed').length;
    console.log('');
    if (failed > 0) {
        (0, logger_js_1.logger)().error(chalk_1.default.bold('failed tests:'));
        tests
            .filter(types_js_1.isDefined)
            .filter((t) => !t.skip && t.status === 'failed')
            .forEach((t) => {
            const err = t.results?.[t.results.length - 1]?.error?.split('\n')[0] ?? '';
            (0, logger_js_1.logger)().error(chalk_1.default.red.bold(`${t.storyPath.join('/')}/${[t.testName, t.browser].filter(Boolean).join('/')}:`), err.replace(/^Error: /, ''));
        });
    }
    console.log('');
    (0, logger_js_1.logger)().info(chalk_1.default.blue.bold('test run summary:'));
    (0, logger_js_1.logger)().info(`  ${chalk_1.default.green('total')}: ${total}`);
    (0, logger_js_1.logger)().info(`  ${chalk_1.default.yellow('skipped')}: ${skipped}`);
    (0, logger_js_1.logger)().info(`  ${chalk_1.default.green('passed')}: ${passed}`);
    (0, logger_js_1.logger)().info(`  ${chalk_1.default.red('failed')}: ${failed}`);
    process.exitCode = isSuccess ? 0 : -1;
    if (!config.failFast)
        await outputUnnecessaryImages(config.screenDir, config.reportDir, (0, utils_js_1.testsToImages)(tests));
    await (0, telemetry_js_1.sendScreenshotsCount)(config, options, runner.status)
        .catch((reason) => {
        const error = reason instanceof Error ? (reason.stack ?? reason.message) : reason;
        (0, logger_js_1.logger)().warn(`Can't send telemetry: ${error}`);
    })
        .finally(() => {
        // NOTE: Take some time to kill processes
        void (0, utils_js_1.shutdownWorkers)().then(() => setTimeout(() => process.exit(), 500));
    });
}
async function start(gridUrl, port, config, options) {
    const host = config.host;
    if (options.ui)
        await (0, utils_js_1.ensureClientStatics)();
    const resolveApi = (0, server_js_1.start)(config.reportDir, port, options.ui, host);
    let runner = null;
    (0, messages_js_1.subscribeOn)('shutdown', () => config.hooks.after?.());
    process.on('SIGINT', () => {
        runner?.removeAllListeners('stop');
        if (runner?.isRunning) {
            // TODO Better handle stop
            void Promise.race([
                new Promise((resolve) => setTimeout(resolve, 10000)),
                new Promise((resolve) => runner?.once('stop', resolve)),
            ]).then(() => (0, utils_js_1.shutdownWorkers)());
            runner.stop();
        }
        else {
            void (0, utils_js_1.shutdownWorkers)();
        }
    });
    runner = await (0, master_js_1.default)(config, gridUrl);
    runner.on('stop', () => {
        void (0, utils_js_1.copyStatics)(config.reportDir).then(() => runner.testsManager.saveTestData());
    });
    if (options.ui) {
        // Initialize TestsManager
        const testsManager = runner.testsManager;
        // Create the CreeveyApi instance using the existing runner
        const api = new api_js_1.CreeveyApi(testsManager, runner);
        // Resolve the API for the server
        resolveApi(api);
        (0, logger_js_1.logger)().info(`Started on http://localhost:${port}`);
    }
    else {
        if (Object.values(runner.status.tests).filter((test) => test && !test.skip).length == 0) {
            (0, logger_js_1.logger)().warn("Don't have any tests to run");
            void (0, utils_js_1.shutdownWorkers)().then(() => process.exit());
            return;
        }
        runner.once('stop', () => {
            void outputSummary(runner, config, options);
        });
        // TODO grep
        runner.start(Object.keys(runner.status.tests));
    }
}
//# sourceMappingURL=start.js.map