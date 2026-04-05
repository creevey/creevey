"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const v = __importStar(require("valibot"));
const loglevel_1 = __importDefault(require("loglevel"));
const cac_1 = require("cac");
const schema_js_1 = require("./schema.js");
const package_json_1 = require("../package.json");
const logger_js_1 = require("./server/logger.js");
const index_js_1 = __importDefault(require("./server/index.js"));
require("./server/shutdown.js");
const workerCli = (0, cac_1.cac)('worker');
workerCli
    .command('worker', 'Start worker')
    .option('--browser <browser>', 'Specify browser to run tests')
    .option('--grid-url <url>', 'Selenium grid URL')
    .option('-d, --debug', 'Enable debug mode')
    .option('-c, --config <config>', 'Path to config file')
    .option('-p, --port <port>', 'Port for UI server', { default: 3000 })
    .option('--trace', 'Enable trace mode (more verbose than debug)')
    .option('--report-dir <dir>', 'Directory for test reports')
    .option('--screen-dir <dir>', 'Directory for reference images')
    .option('--storybook-url <url>', 'Storybook server URL')
    .option('--odiff', 'Use odiff for image comparison');
workerCli.parse();
const cli = (0, cac_1.cac)('creevey');
// TODO Expose command to start PW server
//launchPWServer -> index-source.mjs
cli
    .command('report [reportDir]', 'Launch web UI to review and approve test results')
    .option('-c, --config <config>', 'Path to config file')
    .option('-p, --port <port>', 'Port for UI server', { default: 3000 })
    .option('--screen-dir <dir>', 'Directory for reference images');
// TODO Add ability to start specific tests/files/stories
cli
    .command('test [options]', 'Run tests')
    .option('--ui', 'Launch web UI for running tests and reviewing test results')
    .option('-s, --storybook-start [cmd]', 'Start Storybook automatically')
    .option('-c, --config <config>', 'Path to config file')
    .option('-d, --debug', 'Enable debug mode')
    .option('-p, --port <port>', 'Port for UI server', { default: 3000 })
    .option('--fail-fast', 'Stop tests after first failure')
    .option('--report-dir <dir>', 'Directory for test reports')
    .option('--screen-dir <dir>', 'Directory for reference images')
    .option('--storybook-url <url>', 'Storybook server URL')
    .option('--storybook-port <port>', 'Storybook server port')
    .option('--reporter <reporter>', '[DEPRECATED] Use config file instead')
    .option('--odiff', 'Use odiff for image comparison')
    .option('--trace', 'Enable trace mode (more verbose than debug)')
    .option('--no-docker', 'Disable Docker usage');
cli.version(process.env.npm_package_version ?? package_json_1.version);
cli.help();
cli.parse();
if (process.argv.includes('--help') ||
    process.argv.includes('-h') ||
    process.argv.includes('--version') ||
    process.argv.includes('-v')) {
    process.exit(0);
}
const command = cluster_1.default.isWorker ? workerCli.matchedCommandName : cli.matchedCommandName;
const args = cluster_1.default.isWorker ? workerCli.args : cli.args;
let options;
if (!command || (command !== 'report' && command !== 'test' && command !== 'worker')) {
    console.error('Error: No known command specified\n');
    cli.outputHelp();
    process.exit(1);
}
try {
    options = cluster_1.default.isWorker ? v.parse(schema_js_1.WorkerOptionsSchema, workerCli.options) : v.parse(schema_js_1.OptionsSchema, cli.options);
}
catch (error) {
    if (v.isValiError(error)) {
        console.error('Options validation failed:');
        for (const issue of error.issues) {
            const path = issue.path?.map((p) => p.key).join('.');
            console.error(`  ${path ? `${path}: ` : ''}${issue.message}`);
        }
    }
    else {
        console.error(error);
    }
    console.log();
    cli.matchedCommand?.outputHelp();
    process.exit(1);
}
if (v.is(schema_js_1.OptionsSchema, options) && command == 'report' && args.length > 0) {
    options.reportDir = args[0];
    options.ui = true;
}
// Handle browser name for logging
if (v.is(schema_js_1.WorkerOptionsSchema, options))
    (0, logger_js_1.setRootName)(options.browser);
if (cluster_1.default.isPrimary && 'reporter' in options) {
    (0, logger_js_1.logger)().warn(`--reporter option has been removed please describe reporter in config file:
    import { reporters } from 'mocha';

    const config = {
      reporter: reporters.${options.reporter},
    };

    export default config;
  `);
}
// @ts-expect-error: define log level for storybook
global.LOGLEVEL = options.trace ? 'trace' : options.debug ? 'debug' : 'warn';
if (options.trace) {
    (0, logger_js_1.logger)().setDefaultLevel(loglevel_1.default.levels.TRACE);
    loglevel_1.default.setDefaultLevel(loglevel_1.default.levels.TRACE);
}
else if (options.debug) {
    (0, logger_js_1.logger)().setDefaultLevel(loglevel_1.default.levels.DEBUG);
    loglevel_1.default.setDefaultLevel(loglevel_1.default.levels.DEBUG);
}
else {
    (0, logger_js_1.logger)().setDefaultLevel(loglevel_1.default.levels.INFO);
    loglevel_1.default.setDefaultLevel(loglevel_1.default.levels.INFO);
}
void (0, index_js_1.default)(command, options);
//# sourceMappingURL=creevey.js.map