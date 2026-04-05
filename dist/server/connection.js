"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorybookUrl = getStorybookUrl;
exports.checkIsStorybookConnected = checkIsStorybookConnected;
const utils_js_1 = require("./utils.js");
const logger_js_1 = require("./logger.js");
const RESPONSE_CHECK_TIMEOUT_MS = 10000;
const RESPONSE_CHECK_INTERVAL_MS = 200;
function getStorybookUrl({ storybookUrl }, { storybookStart }) {
    if (storybookStart) {
        const url = new URL(storybookUrl);
        url.hostname = 'localhost';
        return [url.toString(), storybookUrl];
    }
    return [storybookUrl, undefined];
}
async function checkIsStorybookConnected(url) {
    try {
        await (0, utils_js_1.waitOnUrl)(url, RESPONSE_CHECK_TIMEOUT_MS, RESPONSE_CHECK_INTERVAL_MS);
        return true;
    }
    catch (reason) {
        const error = reason instanceof Error ? (reason.stack ?? reason.message) : reason;
        (0, logger_js_1.logger)().error(error);
        return false;
    }
}
//# sourceMappingURL=connection.js.map