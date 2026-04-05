"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = report;
const logger_js_1 = require("./logger.js");
const testsManager_js_1 = require("./master/testsManager.js");
const server_js_1 = require("./master/server.js");
const api_js_1 = require("./master/api.js");
const utils_js_1 = require("./utils.js");
const messages_js_1 = require("./messages.js");
/**
 * UI Update Mode implementation.
 * This mode allows users to review and approve screenshots from the browser interface.
 * It combines the functionality of both --ui and --update flags.
 *
 * @param config Creevey configuration
 * @param port Port to run the server on
 */
async function report(config, reportDir, port) {
    (0, logger_js_1.logger)().info('Starting UI Update Mode');
    await (0, utils_js_1.ensureClientStatics)();
    process.on('SIGINT', () => void (0, utils_js_1.shutdownWorkers)());
    const url = `http://localhost:${port}`;
    // Initialize TestsManager with the configured directories
    const testsManager = new testsManager_js_1.TestsManager(config.screenDir, reportDir);
    // Load tests from the report
    const testsFromReport = testsManager.loadTestsFromReport();
    if (Object.keys(testsFromReport).length === 0) {
        (0, logger_js_1.logger)().warn('No tests found in report. Run tests first to generate report data.');
    }
    // Set tests in the manager
    testsManager.updateTests(testsFromReport);
    (0, messages_js_1.subscribeOn)('test', (message) => {
        if (message.type != 'update' || !message.payload)
            return;
        // TODO: fix type for now
        testsManager.updateTests(message.payload);
    });
    // Start API server with UI enabled
    const resolveApi = (0, server_js_1.start)(reportDir, port, true);
    // Initialize API
    const api = new api_js_1.CreeveyApi(testsManager);
    // Resolve the API for the server
    resolveApi(api);
    (0, logger_js_1.logger)().info(`UI Update Mode started on ${url}`);
    (0, logger_js_1.logger)().info('You can now review and approve screenshots from the browser.');
    void import('open').then(({ default: open }) => open(url));
}
//# sourceMappingURL=report.js.map