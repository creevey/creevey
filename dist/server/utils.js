"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBinary = exports.isInsideDocker = exports.skipOptionKeys = exports.configExt = exports.isShuttingDown = void 0;
exports.getClientDir = getClientDir;
exports.ensureClientStatics = ensureClientStatics;
exports.shouldSkip = shouldSkip;
exports.shouldSkipByOption = shouldSkipByOption;
exports.shutdownOnException = shutdownOnException;
exports.shutdownWorkers = shutdownWorkers;
exports.gracefullyKill = gracefullyKill;
exports.killTree = killTree;
exports.shutdownWithError = shutdownWithError;
exports.resolvePlaywrightBrowserType = resolvePlaywrightBrowserType;
exports.getCreeveyCache = getCreeveyCache;
exports.runSequence = runSequence;
exports.getTestPath = getTestPath;
exports.testsToImages = testsToImages;
exports.readDirRecursive = readDirRecursive;
exports.tryToLoadTestsData = tryToLoadTestsData;
exports.loadThroughTSX = loadThroughTSX;
exports.waitOnUrl = waitOnUrl;
exports.copyStatics = copyStatics;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const assert_1 = __importDefault(require("assert"));
const cluster_1 = __importDefault(require("cluster"));
const pidtree_1 = __importDefault(require("pidtree"));
const url_1 = require("url");
const api_1 = require("tsx/esm/api");
const api_2 = require("tsx/cjs/api");
const types_js_1 = require("../types.js");
const messages_js_1 = require("./messages.js");
const webdriver_js_1 = require("./webdriver.js");
const logger_js_1 = require("./logger.js");
const importMetaUrl = (0, url_1.pathToFileURL)(__filename).href;
exports.isShuttingDown = { current: false };
exports.configExt = ['.js', '.mjs', '.ts', '.cjs', '.mts', '.cts'];
const browserTypes = {
    chromium: 'chromium',
    'chromium-headless-shell': 'chromium',
    chrome: 'chromium',
    'chrome-beta': 'chromium',
    msedge: 'chromium',
    'msedge-beta': 'chromium',
    'msedge-dev': 'chromium',
    'bidi-chromium': 'chromium',
    firefox: 'firefox',
    webkit: 'webkit',
};
exports.skipOptionKeys = ['in', 'kinds', 'stories', 'tests', 'reason'];
function getClientDir() {
    return path_1.default.join(path_1.default.dirname((0, url_1.fileURLToPath)(importMetaUrl)), '../../dist/client/web');
}
async function ensureClientStatics() {
    const clientDir = getClientDir();
    const indexHtml = path_1.default.join(clientDir, 'index.html');
    if (fs_1.default.existsSync(indexHtml))
        return clientDir;
    (0, logger_js_1.logger)().info('Building Creevey web UI...');
    try {
        const { build } = await import('vite');
        await build({
            configFile: path_1.default.join(path_1.default.dirname((0, url_1.fileURLToPath)(importMetaUrl)), '../../vite.config.mts'),
            logLevel: 'error',
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to build Creevey web UI: ${errorMessage}`);
    }
    if (!fs_1.default.existsSync(indexHtml)) {
        throw new Error(`Failed to build Creevey web UI: ${indexHtml} was not created`);
    }
    return clientDir;
}
function matchBy(pattern, value) {
    return ((typeof pattern == 'string' && pattern == value) ||
        (Array.isArray(pattern) && pattern.includes(value)) ||
        (pattern instanceof RegExp && pattern.test(value)) ||
        !(0, types_js_1.isDefined)(pattern));
}
function shouldSkip(browser, meta, skipOptions, test) {
    if (typeof skipOptions != 'object') {
        return skipOptions;
    }
    for (const skipKey in skipOptions) {
        const reason = shouldSkipByOption(browser, meta, skipOptions[skipKey], skipKey, test);
        if (reason)
            return reason;
    }
    return false;
}
function shouldSkipByOption(browser, meta, skipOption, reason, test) {
    if (Array.isArray(skipOption)) {
        for (const skip of skipOption) {
            const result = shouldSkipByOption(browser, meta, skip, reason, test);
            if (result)
                return result;
        }
        return false;
    }
    const { in: browsers, kinds, stories, tests } = skipOption;
    const { title, name } = meta;
    const skipByBrowser = matchBy(browsers, browser);
    const skipByKind = matchBy(kinds, title);
    const skipByStory = matchBy(stories, name);
    const skipByTest = !(0, types_js_1.isDefined)(test) || matchBy(tests, test);
    return skipByBrowser && skipByKind && skipByStory && skipByTest && reason;
}
function shutdownOnException(reason) {
    if (exports.isShuttingDown.current)
        return;
    const error = reason instanceof Error ? (reason.stack ?? reason.message) : reason;
    (0, logger_js_1.logger)().error(error);
    process.exitCode = -1;
    if (cluster_1.default.isWorker)
        (0, messages_js_1.emitWorkerMessage)({ type: 'error', payload: { subtype: 'unknown', error } });
    if (cluster_1.default.isPrimary)
        void shutdownWorkers();
}
async function shutdownWorkers() {
    exports.isShuttingDown.current = true;
    await Promise.all(Object.values(cluster_1.default.workers ?? {})
        .filter(types_js_1.isDefined)
        .filter((worker) => worker.isConnected())
        .map((worker) => new Promise((resolve) => {
        const timeout = setTimeout(() => {
            if (worker.process.pid)
                void killTree(worker.process.pid);
        }, 10_000);
        worker.on('exit', () => {
            clearTimeout(timeout);
            resolve();
        });
        (0, messages_js_1.sendShutdownMessage)(worker);
        worker.disconnect();
    })));
    (0, messages_js_1.emitShutdownMessage)();
}
function gracefullyKill(worker) {
    worker.isShuttingDown = true;
    const timeout = setTimeout(() => {
        if (worker.process.pid)
            void killTree(worker.process.pid);
    }, 10000);
    worker.on('exit', () => {
        clearTimeout(timeout);
    });
    (0, messages_js_1.sendShutdownMessage)(worker);
    worker.disconnect();
}
async function killTree(rootPid) {
    const pids = await (0, pidtree_1.default)(rootPid, { root: true });
    pids.forEach((pid) => {
        try {
            process.kill(pid, 'SIGKILL');
        }
        catch {
            /* noop */
        }
    });
}
function shutdownWithError() {
    process.exit(1);
}
function resolvePlaywrightBrowserType(browserName) {
    (0, assert_1.default)(browserName in browserTypes, new Error(`Failed to match browser name "${browserName}" to playwright browserType`));
    return browserTypes[browserName];
}
async function getCreeveyCache() {
    const { default: findCacheDir } = await import('find-cache-dir');
    return findCacheDir({ name: 'creevey', cwd: path_1.default.dirname((0, url_1.fileURLToPath)(importMetaUrl)) });
}
async function runSequence(seq, predicate) {
    for (const fn of seq) {
        if (predicate())
            await fn();
    }
    return predicate();
}
function getTestPath(test) {
    return [...test.storyPath, test.testName, test.browser].filter(types_js_1.isDefined);
}
function testsToImages(tests) {
    return new Set([].concat(...tests
        .filter(types_js_1.isDefined)
        .map(({ browser, testName, storyPath, results }) => Object.keys(results?.slice(-1)[0]?.images ?? {}).map((image) => `${[...storyPath, testName, browser, browser == image ? undefined : image]
        .filter(types_js_1.isDefined)
        .join('/')}.png`))));
}
// https://tuhrig.de/how-to-know-you-are-inside-a-docker-container/
exports.isInsideDocker = (fs_1.default.existsSync('/proc/1/cgroup') && fs_1.default.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker')) ||
    process.env.DOCKER === 'true';
const downloadBinary = (downloadUrl, destination) => new Promise((resolve, reject) => https_1.default.get(downloadUrl, (response) => {
    if (response.statusCode == 302) {
        const { location } = response.headers;
        if (!location) {
            reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));
            return;
        }
        resolve((0, exports.downloadBinary)(location, destination));
        return;
    }
    if (response.statusCode != 200) {
        reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));
        return;
    }
    const fileStream = fs_1.default.createWriteStream(destination);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
        fileStream.close();
        resolve();
    });
    fileStream.on('error', (error) => {
        fs_1.default.unlink(destination, types_js_1.noop);
        reject(error);
    });
}));
exports.downloadBinary = downloadBinary;
function readDirRecursive(dirPath) {
    return [].concat(...fs_1.default
        .readdirSync(dirPath, { withFileTypes: true })
        .map((dirent) => dirent.isDirectory() ? readDirRecursive(`${dirPath}/${dirent.name}`) : [`${dirPath}/${dirent.name}`]));
}
function tryToLoadTestsData(filename) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/no-dynamic-require
        return require(filename);
    }
    catch {
        /* noop */
    }
}
const [nodeVersion] = process.versions.node.split('.').map(Number);
async function loadThroughTSX(callback) {
    const unregisterESM = nodeVersion > 18 ? (0, api_1.register)() : types_js_1.noop;
    const unregisterCJS = (0, api_2.register)();
    const result = await callback((modulePath) => nodeVersion > 18
        ? import(modulePath)
        : // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/no-dynamic-require
            Promise.resolve(require(modulePath)));
    // NOTE: `unregister` type is `(() => Promise<void>) | (() => void)`
    // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
    await unregisterCJS();
    // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
    await unregisterESM();
    return result;
}
function waitOnUrl(waitUrl, timeout, delay) {
    const urls = [waitUrl];
    if (!webdriver_js_1.LOCALHOST_REGEXP.test(waitUrl)) {
        const parsedUrl = new URL(waitUrl);
        parsedUrl.host = 'localhost';
        urls.push(parsedUrl.toString());
    }
    const startTime = Date.now();
    return Promise.race(urls.map((url) => new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            const parsedUrl = new URL(url);
            const get = parsedUrl.protocol === 'http:' ? http_1.default.get.bind(http_1.default) : https_1.default.get.bind(https_1.default);
            get(url, (response) => {
                if (response.statusCode === 200) {
                    clearInterval(interval);
                    resolve();
                }
            }).on('error', () => {
                // Ignore HTTP errors
            });
            if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error(`${url} didn't respond within ${timeout / 1000} seconds`));
            }
        }, delay);
    })));
}
/**
 * Copies static assets to the report directory
 * @param reportDir Directory where the report will be generated
 */
async function copyStatics(reportDir) {
    const clientDir = await ensureClientStatics();
    const assets = (await fs_1.default.promises.readdir(path_1.default.join(clientDir, 'assets'), { withFileTypes: true }))
        .filter((dirent) => dirent.isFile())
        .map((dirent) => dirent.name);
    await fs_1.default.promises.mkdir(path_1.default.join(reportDir, 'assets'), { recursive: true });
    await fs_1.default.promises.copyFile(path_1.default.join(clientDir, 'index.html'), path_1.default.join(reportDir, 'index.html'));
    for (const asset of assets) {
        await fs_1.default.promises.copyFile(path_1.default.join(clientDir, 'assets', asset), path_1.default.join(reportDir, 'assets', asset));
    }
}
//# sourceMappingURL=utils.js.map