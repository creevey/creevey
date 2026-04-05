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
exports.default = default_1;
const cluster_1 = __importDefault(require("cluster"));
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const detect_1 = require("package-manager-detector/detect");
const commands_1 = require("package-manager-detector/commands");
const config_js_1 = require("./config.js");
const types_js_1 = require("../types.js");
const schema_js_1 = require("../schema.js");
const logger_js_1 = require("./logger.js");
const connection_js_1 = require("./connection.js");
const webdriver_js_1 = require("./selenium/webdriver.js");
const webdriver_js_2 = require("./webdriver.js");
const utils_js_1 = require("./utils.js");
const messages_js_1 = require("./messages.js");
const docker_js_1 = require("./docker.js");
const promises_1 = require("fs/promises");
const assert_1 = __importDefault(require("assert"));
const v = __importStar(require("valibot"));
const playwright_js_1 = require("../playwright.js");
async function getPlaywrightVersion() {
    const { default: { version }, } = await import('playwright-core/package.json', { with: { type: 'json' } });
    return version;
}
async function startSelenoid(config, debug = false) {
    const { startSelenoidContainer, startSelenoidStandalone } = await import('./selenium/selenoid.js');
    const gridUrl = 'http://localhost:4444/wd/hub';
    if (config.useDocker) {
        const host = await startSelenoidContainer(config, debug);
        return utils_js_1.isInsideDocker ? gridUrl.replace(webdriver_js_2.LOCALHOST_REGEXP, host) : gridUrl;
    }
    await startSelenoidStandalone(config, debug);
    return gridUrl;
}
async function startPlaywright(config, browser, version, debug = false) {
    // TODO Re-use dockerImage
    const { startPlaywrightContainer } = await import('./playwright/docker.js');
    const { browserName } = config.browsers[browser];
    const imageName = `creevey/${browserName}:v${version}`;
    const host = await startPlaywrightContainer(imageName, browser, config, debug);
    return host;
}
async function buildPlaywright(config, version) {
    const { playwrightDockerFile } = await import('./playwright/docker-file.js');
    const { default: { version: creeveyVersion }, } = await import('../../package.json', { with: { type: 'json' } });
    const browsers = [...new Set(Object.values(config.browsers).map((c) => c.browserName))];
    await Promise.all(browsers.map(async (browserName) => {
        const imageName = `creevey/${browserName}:v${version}`;
        const dockerfile = await playwrightDockerFile(browserName, version, config.experimental?.npmRegistry);
        await (0, docker_js_1.buildImage)(imageName, creeveyVersion, dockerfile);
    }));
    const { default: getPort } = await import('get-port');
    cluster_1.default.on('message', (worker, message) => {
        if (!(0, types_js_1.isWorkerMessage)(message))
            return;
        const workerMessage = message;
        if (workerMessage.type != 'port')
            return;
        void getPort().then((port) => {
            (0, messages_js_1.sendWorkerMessage)(worker, {
                type: 'port',
                payload: { port },
            });
        });
    });
}
async function startWebdriverServer(config, options) {
    if (config.webdriver === webdriver_js_1.SeleniumWebdriver) {
        return startSelenoid(config, options.debug);
        // TODO Worker might want to use docker image of browser or start standalone selenium
    }
    else {
        if (config.gridUrl)
            return undefined;
        if (config.useDocker) {
            const version = await getPlaywrightVersion();
            await buildPlaywright(config, version);
        }
        // TODO Support gridUrl for playwright
        // NOTE: There is no grid for playwright right now
    }
}
async function waitForStorybook(config, options) {
    const [localUrl, remoteUrl] = (0, connection_js_1.getStorybookUrl)(config, options);
    if (options.storybookStart) {
        const pm = (0, detect_1.getUserAgent)();
        (0, assert_1.default)(pm, new Error('Failed to detect current package manager'));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { command, args } = (0, commands_1.resolveCommand)(pm, 'run', ['storybook', 'dev']);
        const storybookPort = new URL(localUrl).port;
        const storybookCommand = config.storybookAutorunCmd ?? [command, ...args, '--ci', '-p', storybookPort].join(' ');
        (0, logger_js_1.logger)().info(`Start Storybook via \`${storybookCommand}\`, it should be accessible at:`);
        (0, logger_js_1.logger)().info(`Local - ${localUrl}`);
        if (remoteUrl && localUrl != remoteUrl)
            (0, logger_js_1.logger)().info(`On your network - ${remoteUrl}`);
        (0, logger_js_1.logger)().info('Waiting Storybook...');
        const storybook = shelljs_1.default.exec(storybookCommand, { async: true });
        (0, messages_js_1.subscribeOn)('shutdown', () => {
            if (storybook.pid)
                void (0, utils_js_1.killTree)(storybook.pid);
        });
    }
    else {
        (0, logger_js_1.logger)().info('Storybook should be started and be accessible at:');
        (0, logger_js_1.logger)().info(`Local - ${localUrl}`);
        if (remoteUrl && localUrl != remoteUrl)
            (0, logger_js_1.logger)().info(`On your network - ${remoteUrl}`);
        (0, logger_js_1.logger)().info('Tip: Creevey can start Storybook automatically by using `-s` option at the command line. (e.g., yarn/npm run creevey -s)');
        (0, logger_js_1.logger)().info('Waiting Storybook...');
    }
    if (options.storybookStart || process.env.CI !== 'true') {
        const isConnected = await (0, connection_js_1.checkIsStorybookConnected)(localUrl);
        if (isConnected) {
            (0, logger_js_1.logger)().info('Storybook connected!\n');
        }
        else {
            (0, logger_js_1.logger)().error('Storybook is not responding. Please start Storybook and restart Creevey');
            (0, utils_js_1.shutdownWithError)();
        }
    }
}
// TODO Why docker containers are not deleting after stop?
async function default_1(command, options) {
    const config = await (0, config_js_1.readConfig)(options);
    await import('./shutdown.js');
    if (v.is(schema_js_1.OptionsSchema, options)) {
        const { port, reportDir = config.reportDir } = options;
        // TODO Add package.json with `"type": "commonjs"` as workaround for esm packages to load `data.js`
        await (0, promises_1.mkdir)(reportDir, { recursive: true });
        await (0, promises_1.writeFile)(path_1.default.join(reportDir, 'package.json'), '{"type": "commonjs"}');
        if (command == 'report') {
            const { report } = await import('./report.js');
            const { default: getPort } = await import('get-port');
            const freePort = await getPort({ port });
            await report(config, reportDir, freePort);
            return;
        }
        if (cluster_1.default.isPrimary) {
            let gridUrl = config.gridUrl;
            if (config.hooks.before) {
                await config.hooks.before();
            }
            if (!(gridUrl || Object.values(config.browsers).every(({ gridUrl }) => gridUrl))) {
                gridUrl = await startWebdriverServer(config, options);
            }
            await waitForStorybook(config, options);
            if (config.webdriver === webdriver_js_1.SeleniumWebdriver) {
                try {
                    await import('selenium-webdriver');
                }
                catch {
                    (0, logger_js_1.logger)().error('Failed to start Creevey, missing required dependency: "selenium-webdriver"');
                    process.exit(-1);
                }
            }
            else {
                try {
                    await import('playwright-core');
                }
                catch {
                    (0, logger_js_1.logger)().error('Failed to start Creevey, missing required dependency: "playwright-core"');
                    process.exit(-1);
                }
            }
            (0, logger_js_1.logger)().info('Starting Master Process');
            const { default: getPort } = await import('get-port');
            const freePort = await getPort({ port });
            return (await import('./master/start.js')).start(gridUrl, freePort, config, options);
        }
    }
    if (v.is(schema_js_1.WorkerOptionsSchema, options) && cluster_1.default.isWorker) {
        let gridUrl = options.gridUrl;
        const { browser = config_js_1.defaultBrowser, debug } = options;
        if (!gridUrl) {
            if (config.webdriver === playwright_js_1.PlaywrightWebdriver) {
                if (config.useDocker) {
                    const version = await getPlaywrightVersion();
                    gridUrl = await startPlaywright(config, browser, version, debug);
                }
                else {
                    const { browserName } = config.browsers[browser];
                    gridUrl = `creevey://${(0, utils_js_1.resolvePlaywrightBrowserType)(browserName)}`;
                }
            }
            else {
                (0, assert_1.default)(gridUrl, 'Grid URL is required for Selenium');
            }
        }
        (0, logger_js_1.logger)().info(`Starting Worker for ${browser}`);
        return (await import('./worker/start.js')).start(browser, gridUrl, config, options);
    }
}
//# sourceMappingURL=index.js.map