"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreeveyWebdriverBase = exports.LOCALHOST_REGEXP = exports.storybookRootID = void 0;
exports.resolveStorybookUrl = resolveStorybookUrl;
exports.appendIframePath = appendIframePath;
exports.getAddresses = getAddresses;
const chalk_1 = __importDefault(require("chalk"));
const os_1 = require("os");
const logger_js_1 = require("./logger.js");
const types_js_1 = require("../types.js");
exports.storybookRootID = 'storybook-root';
exports.LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/i;
const DOCKER_INTERNAL = 'host.docker.internal';
async function resolveStorybookUrl(storybookUrl, checkUrl) {
    (0, logger_js_1.logger)().debug('Resolving storybook url');
    const addresses = getAddresses();
    // TODO Use Promise.race?
    for (const ip of addresses) {
        const resolvedUrl = storybookUrl.replace(exports.LOCALHOST_REGEXP, ip);
        (0, logger_js_1.logger)().debug(`Checking storybook availability on ${chalk_1.default.magenta(resolvedUrl)}`);
        if (await checkUrl(resolvedUrl)) {
            (0, logger_js_1.logger)().debug(`Resolved storybook url ${chalk_1.default.magenta(resolvedUrl)}`);
            return resolvedUrl;
        }
    }
    const error = new Error('Please specify `storybookUrl` with IP address that accessible from remote browser');
    error.name = 'ResolveUrlError';
    throw error;
}
function appendIframePath(url) {
    return `${url.replace(/\/$/, '')}/iframe.html`;
}
function getAddresses() {
    // TODO Check if docker is used
    return [DOCKER_INTERNAL].concat(...Object.values((0, os_1.networkInterfaces)())
        .filter(types_js_1.isDefined)
        .map((network) => network.filter((info) => info.family == 'IPv4').map((info) => info.address)));
}
class CreeveyWebdriverBase {
    async switchStory(story, context) {
        const { id, title, name, parameters } = story;
        const { captureElement = `#${exports.storybookRootID}`, ignoreElements } = (parameters.creevey ?? {});
        (0, logger_js_1.logger)().debug(`Switching to story ${chalk_1.default.cyan(title)}/${chalk_1.default.cyan(name)} by id ${chalk_1.default.magenta(id)}`);
        await this.selectStory(id);
        return Object.assign({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            takeScreenshot: (options) => this.takeScreenshot(captureElement, ignoreElements, options),
            updateStoryArgs: (updatedArgs) => this.updateStoryArgs(story, updatedArgs),
            captureElement,
        }, context);
    }
}
exports.CreeveyWebdriverBase = CreeveyWebdriverBase;
//# sourceMappingURL=webdriver.js.map