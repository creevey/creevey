"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreeveyReporter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const loglevel_1 = __importDefault(require("loglevel"));
const loglevel_plugin_prefix_1 = __importDefault(require("loglevel-plugin-prefix"));
const types_js_1 = require("../../types.js");
const testLevels = {
    INFO: chalk_1.default.green('PASS '),
    WARN: chalk_1.default.yellow('START'),
    ERROR: chalk_1.default.red('FAIL '),
};
let browserName = '';
let sessionId = '';
let processId = process.pid;
class CreeveyReporter {
    logger = null;
    // TODO Output in better way, like vitest, maybe
    constructor(runner) {
        runner.on(types_js_1.TEST_EVENTS.TEST_BEGIN, (test) => {
            this.getLogger(test.creevey).warn(chalk_1.default.cyan(test.fullTitle()));
        });
        runner.on(types_js_1.TEST_EVENTS.TEST_PASS, (test) => {
            this.getLogger(test.creevey).info(chalk_1.default.cyan(test.fullTitle()), test.duration ? chalk_1.default.gray(`(${test.duration} ms)`) : '');
        });
        runner.on(types_js_1.TEST_EVENTS.TEST_FAIL, (test, error) => {
            this.getLogger(test.creevey).error(chalk_1.default.cyan(test.fullTitle()), test.duration ? chalk_1.default.gray(`(${test.duration} ms)`) : '', '\n  ', this.getErrors(error, (error, imageName) => `${chalk_1.default.bold(imageName ?? test.creevey.browserName)}:${error}`, (error) => error.stack ?? error.message).join('\n  '));
        });
    }
    getLogger(options) {
        ({ sessionId, browserName, workerId: processId = process.pid } = options);
        if (this.logger)
            return this.logger;
        const testLogger = loglevel_1.default.getLogger(sessionId);
        this.logger = loglevel_plugin_prefix_1.default.apply(testLogger, {
            format(level) {
                return `[${browserName}:${chalk_1.default.gray(processId)}] ${testLevels[level]} => ${chalk_1.default.gray(sessionId)}`;
            },
        });
        return this.logger;
    }
    getErrors(error, imageErrorToString, errorToString) {
        const errors = [];
        if (!(error instanceof Error)) {
            errors.push(error);
        }
        else if (!(0, types_js_1.isImageError)(error)) {
            errors.push(errorToString(error));
        }
        else if (typeof error.images == 'string') {
            errors.push(imageErrorToString(error.images));
        }
        else {
            const imageErrors = error.images ?? {};
            Object.keys(imageErrors).forEach((imageName) => {
                errors.push(imageErrorToString(imageErrors[imageName] ?? '', imageName));
            });
        }
        return errors;
    }
}
exports.CreeveyReporter = CreeveyReporter;
//# sourceMappingURL=creevey.js.map