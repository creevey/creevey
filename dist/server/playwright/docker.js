"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPlaywrightContainer = startPlaywrightContainer;
const assert_1 = __importDefault(require("assert"));
const promises_1 = require("fs/promises");
const docker_1 = require("../docker");
const messages_1 = require("../messages");
const utils_1 = require("../utils");
const webdriver_1 = require("../webdriver");
async function startPlaywrightContainer(imageName, browser, config, debug) {
    const { browserName, playwrightOptions } = config.browsers[browser];
    const port = await new Promise((resolve) => {
        (0, messages_1.subscribeOn)('worker', (message) => {
            if (message.type == 'port') {
                resolve(message.payload.port);
            }
        });
        (0, messages_1.emitWorkerMessage)({ type: 'port', payload: { port: -1 } });
    });
    const cacheDir = await (0, utils_1.getCreeveyCache)();
    (0, assert_1.default)(cacheDir, "Couldn't get cache directory");
    // NOTE: Docker creates root directory if it doesn't exist, but Podman doesn't create it
    // https://github.com/containers/podman/issues/6234
    await (0, promises_1.mkdir)(`${cacheDir}/${process.pid}`, { recursive: true });
    const host = await (0, docker_1.runImage)(imageName, [JSON.stringify({ ...playwrightOptions, browser: (0, utils_1.resolvePlaywrightBrowserType)(browserName) })], {
        ExposedPorts: { [`${port}/tcp`]: {} },
        HostConfig: {
            PortBindings: { ['4444/tcp']: [{ HostPort: `${port}` }] },
            Binds: [`${cacheDir}/${process.pid}:/creevey/traces`],
            // Mount current working directory with creevey and playwright-core
            // VolumesFrom: [`${process.cwd()}`],
        },
        // TODO Run creevey through package manager which starts pw server from index-source.mjs
        // Entrypoint: ['pkgManager', 'creevey', 'launchPWServer', JSON.stringify(options)],
    }, debug);
    const gridUrl = `ws://localhost:${port}/creevey`;
    return utils_1.isInsideDocker ? gridUrl.replace(webdriver_1.LOCALHOST_REGEXP, host) : gridUrl;
}
//# sourceMappingURL=docker.js.map