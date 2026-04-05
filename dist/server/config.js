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
exports.defaultConfig = exports.defaultBrowser = void 0;
exports.readConfig = readConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cluster_1 = __importDefault(require("cluster"));
const url_1 = require("url");
const v = __importStar(require("valibot"));
const hybrid_js_1 = require("./providers/hybrid.js");
const types_js_1 = require("../types.js");
const schema_js_1 = require("../schema.js");
const utils_js_1 = require("./utils.js");
const creevey_js_1 = require("./reporters/creevey.js");
const teamcity_js_1 = require("./reporters/teamcity.js");
const logger_js_1 = require("./logger.js");
exports.defaultBrowser = 'chrome';
exports.defaultConfig = {
    disableTelemetry: false,
    useWorkerQueue: false,
    useDocker: true,
    dockerImage: 'aerokube/selenoid:latest', // TODO What about playwright?
    dockerImagePlatform: '',
    pullImages: true,
    failFast: false,
    storybookUrl: 'http://localhost:6006',
    screenDir: path_1.default.resolve('images'),
    reportDir: path_1.default.resolve('report'),
    testsDir: path_1.default.resolve('src'),
    reporter: process.env.TEAMCITY_VERSION ? teamcity_js_1.TeamcityReporter : creevey_js_1.CreeveyReporter,
    storiesProvider: hybrid_js_1.loadStories,
    maxRetries: 0,
    testTimeout: 30000,
    connectionTimeout: 60000,
    diffOptions: { threshold: 0.1, includeAA: false },
    odiffOptions: { threshold: 0.1, antialiasing: true },
    browsers: { [exports.defaultBrowser]: true },
    hooks: {},
    testsRegex: /\.creevey\.(m|c)?(t|j)s$/,
};
function normalizeBrowserConfig(name, config) {
    if (typeof config == 'boolean')
        return { browserName: name };
    if (typeof config == 'string')
        return { browserName: config };
    return config;
}
function resolveConfigPath(configPath) {
    const configDir = path_1.default.resolve('.creevey');
    if ((0, types_js_1.isDefined)(configPath)) {
        configPath = path_1.default.resolve(configPath);
    }
    else if (fs_1.default.existsSync(configDir)) {
        for (const ext of utils_js_1.configExt) {
            configPath = path_1.default.resolve(configDir, `config${ext}`);
            if (fs_1.default.existsSync(configPath))
                break;
        }
    }
    else {
        for (const ext of utils_js_1.configExt) {
            configPath = path_1.default.resolve(`creevey.config${ext}`);
            if (fs_1.default.existsSync(configPath))
                break;
        }
    }
    return configPath;
}
async function readConfig(options) {
    const configPath = resolveConfigPath(options.config);
    const userConfig = { ...exports.defaultConfig };
    let hasExplicitStoriesProvider = false;
    if ((0, types_js_1.isDefined)(configPath)) {
        const configModule = await (0, utils_js_1.loadThroughTSX)((load) => {
            const configFileUrl = (0, url_1.pathToFileURL)(configPath).toString();
            return load(configFileUrl);
        });
        let configData = 'default' in configModule ? configModule.default : configModule;
        // NOTE In node > 18 with commonjs project and esm config with tsconfig moduleResolution nodeNext there is additional 'default'
        configData = 'default' in configData ? configData.default : configData;
        if (!configData.webdriver) {
            const { SeleniumWebdriver } = await import('./selenium/webdriver.js');
            (0, logger_js_1.logger)().warn("Creevey supports `Selenium` and `Playwright` webdrivers. For backward compatibility `Selenium` is used by default, but it might changed in the future. Please explicitly specify one of webdrivers in your Creevey's config");
            configData.webdriver = SeleniumWebdriver;
        }
        for (const key in configData) {
            const configKey = key;
            if (configData[configKey] === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete configData[configKey];
            }
        }
        if ('storiesProvider' in configData) {
            hasExplicitStoriesProvider = true;
        }
        Object.assign(userConfig, configData);
    }
    if (userConfig.resolveStorybookUrl && !options.storybookUrl) {
        userConfig.storybookUrl = await userConfig.resolveStorybookUrl();
    }
    if (options.reportDir)
        userConfig.reportDir = path_1.default.resolve(options.reportDir);
    if (options.screenDir)
        userConfig.screenDir = path_1.default.resolve(options.screenDir);
    if (options.storybookUrl)
        userConfig.storybookUrl = options.storybookUrl;
    if (v.is(schema_js_1.OptionsSchema, options)) {
        if (options.docker === false)
            userConfig.useDocker = false;
        if (options.failFast != undefined)
            userConfig.failFast = Boolean(options.failFast);
        if (cluster_1.default.isPrimary) {
            if (options.storybookPort) {
                const url = new URL(userConfig.storybookUrl);
                url.port = `${options.storybookPort}`;
                userConfig.storybookUrl = url.toString();
            }
            if (typeof options.storybookStart === 'string')
                userConfig.storybookAutorunCmd = options.storybookStart;
            else if (options.storybookStart) {
                const { default: getPort } = await import('get-port');
                const url = new URL(userConfig.storybookUrl);
                const port = await getPort({ port: Number(url.port) });
                url.port = `${port}`;
                userConfig.storybookUrl = url.toString();
            }
        }
    }
    if (!path_1.default.isAbsolute(userConfig.reportDir)) {
        userConfig.reportDir = path_1.default.resolve(userConfig.reportDir);
    }
    if (!path_1.default.isAbsolute(userConfig.screenDir)) {
        userConfig.screenDir = path_1.default.resolve(userConfig.screenDir);
    }
    if (userConfig.testsDir && !path_1.default.isAbsolute(userConfig.testsDir)) {
        userConfig.testsDir = path_1.default.resolve(userConfig.testsDir);
    }
    // NOTE: Hack to pass typescript checking
    const config = userConfig;
    Object.entries(config.browsers).forEach(([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig)));
    // Check if browserStoriesProvider is explicitly set and add deprecation warning
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    if (hasExplicitStoriesProvider && config.storiesProvider.providerName === 'browser') {
        (0, logger_js_1.logger)().warn('The `browserStoriesProvider` is deprecated and will be removed in a future version. ' +
            'Creevey will use only the `hybrid` stories provider going forward. ' +
            'Please remove the `storiesProvider` property from your config as `hybridStoriesProvider` is already the default.');
    }
    return config;
}
//# sourceMappingURL=config.js.map