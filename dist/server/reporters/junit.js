"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JUnitReporter = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const types_js_1 = require("../../types.js");
const logger_js_1 = require("../logger.js");
const creevey_js_1 = require("./creevey.js");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class IndentedLogger {
    baseLog;
    currentIndent = '';
    constructor(baseLog) {
        this.baseLog = baseLog;
    }
    indent() {
        this.currentIndent += '    ';
    }
    unindent() {
        this.currentIndent = this.currentIndent.substring(0, this.currentIndent.length - 4);
    }
    log(text) {
        return this.baseLog(this.currentIndent + text);
    }
}
// NOTE: This is a reworked copy of the JUnitReporter class from Vitest.
class JUnitReporter {
    reportFile;
    fileFd;
    logger;
    // @ts-expect-error Ignore unused
    creeveyReporter;
    suites = {};
    // TODO classnameTemplate
    // TODO Output console logs
    // TODO Output attachments
    constructor(runner, options) {
        const { reportDir, reporterOptions } = options;
        this.reportFile = reporterOptions.outputFile ?? (0, path_1.resolve)(reportDir, 'junit.xml');
        this.logger = new IndentedLogger((text) => {
            this.fileFd ??= (0, fs_1.openSync)(this.reportFile, 'w+');
            (0, fs_1.writeFileSync)(this.fileFd, `${text}\n`);
        });
        this.creeveyReporter = new creevey_js_1.CreeveyReporter(runner);
        runner.on(types_js_1.TEST_EVENTS.RUN_BEGIN, () => {
            this.suites = {};
            const outputDirectory = (0, path_1.dirname)(this.reportFile);
            if (!(0, fs_1.existsSync)(outputDirectory)) {
                (0, fs_1.mkdirSync)(outputDirectory, { recursive: true });
            }
            this.fileFd = (0, fs_1.openSync)(this.reportFile, 'w+');
        });
        runner.on(types_js_1.TEST_EVENTS.TEST_PASS, (test) => {
            const suite = (this.suites[test.parent.title] ??= new Map());
            suite.set(test.creevey.testId, test);
        });
        runner.on(types_js_1.TEST_EVENTS.TEST_FAIL, (test) => {
            const suite = (this.suites[test.parent.title] ??= new Map());
            suite.set(test.creevey.testId, test);
        });
        runner.on(types_js_1.TEST_EVENTS.RUN_END, () => {
            this.onFinished();
        });
    }
    writeElement(name, attrs, children) {
        const pairs = [];
        for (const key in attrs) {
            const attr = attrs[key];
            if (attr === undefined) {
                continue;
            }
            pairs.push(`${key}="${escapeXML(attr)}"`);
        }
        this.logger.log(`<${name}${pairs.length ? ` ${pairs.join(' ')}` : ''}>`);
        this.logger.indent();
        children?.call(this);
        this.logger.unindent();
        this.logger.log(`</${name}>`);
    }
    writeTasks(tests) {
        for (const [, test] of tests) {
            const classname = test.parent.title;
            this.writeElement('testcase', {
                classname,
                name: test.title,
                time: getDuration(test),
            }, () => {
                if (test.state === 'failed') {
                    const error = test.err;
                    this.writeElement('failure', { message: error });
                }
            });
        }
    }
    onFinished() {
        this.logger.log('<?xml version="1.0" encoding="UTF-8" ?>');
        const suites = Object.entries(this.suites).map(([name, tests]) => {
            let failures = 0;
            let time = 0;
            for (const [_, test] of tests) {
                if (test.state === 'failed') {
                    failures++;
                }
                time += test.duration ?? 0;
            }
            return {
                name,
                tests,
                failures,
                time,
            };
        });
        const stats = suites.reduce((s, { tests, failures, time }) => {
            s.tests += tests.size;
            s.failures += failures;
            s.time += time;
            return s;
        }, { name: 'creevey tests', tests: 0, failures: 0, time: 0 });
        this.writeElement('testsuites', { ...stats, time: executionTime(stats.time) }, () => {
            suites.forEach(({ name, tests, failures, time }) => {
                this.writeElement('testsuite', {
                    name,
                    tests: tests.size,
                    failures,
                    time: executionTime(time),
                }, () => {
                    this.writeTasks(tests);
                });
            });
        });
        if (this.reportFile) {
            (0, logger_js_1.logger)().info(`JUNIT report written to ${this.reportFile}`);
        }
        if (this.fileFd) {
            (0, fs_1.closeSync)(this.fileFd);
            this.fileFd = undefined;
        }
    }
}
exports.JUnitReporter = JUnitReporter;
// https://gist.github.com/john-doherty/b9195065884cdbfd2017a4756e6409cc
function removeInvalidXMLCharacters(value, removeDiscouragedChars) {
    let regex = 
    // eslint-disable-next-line no-control-regex
    /([\0-\x08\v\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
    value = String(value).replace(regex, '');
    if (removeDiscouragedChars) {
        // remove everything discouraged by XML 1.0 specifications
        regex = new RegExp('([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|\\uD83F[\\uDFFE\\uDFFF]|(?:\\uD87F[\\uDF' +
            'FE\\uDFFF])|\\uD8BF[\\uDFFE\\uDFFF]|\\uD8FF[\\uDFFE\\uDFFF]|(?:\\uD93F[\\uDFFE\\uD' +
            'FFF])|\\uD97F[\\uDFFE\\uDFFF]|\\uD9BF[\\uDFFE\\uDFFF]|\\uD9FF[\\uDFFE\\uDFFF]' +
            '|\\uDA3F[\\uDFFE\\uDFFF]|\\uDA7F[\\uDFFE\\uDFFF]|\\uDABF[\\uDFFE\\uDFFF]|(?:\\' +
            'uDAFF[\\uDFFE\\uDFFF])|\\uDB3F[\\uDFFE\\uDFFF]|\\uDB7F[\\uDFFE\\uDFFF]|(?:\\uDBBF' +
            '[\\uDFFE\\uDFFF])|\\uDBFF[\\uDFFE\\uDFFF](?:[\\0-\\t\\v\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
            'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
            '(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))', 'g');
        value = value.replace(regex, '');
    }
    return value;
}
function escapeXML(value) {
    return removeInvalidXMLCharacters(String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;'), true);
}
function executionTime(durationMS) {
    return (durationMS / 1000).toLocaleString('en-US', {
        useGrouping: false,
        maximumFractionDigits: 10,
    });
}
function getDuration(task) {
    const duration = task.duration ?? 0;
    return executionTime(duration);
}
//# sourceMappingURL=junit.js.map