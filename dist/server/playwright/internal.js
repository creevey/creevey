"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalBrowser = void 0;
const path_1 = __importDefault(require("path"));
const assert_1 = __importDefault(require("assert"));
const playwright_core_1 = require("playwright-core");
const chalk_1 = __importDefault(require("chalk"));
const uuid_1 = require("uuid");
const loglevel_1 = __importDefault(require("loglevel"));
const loglevel_plugin_prefix_1 = __importDefault(require("loglevel-plugin-prefix"));
const types_1 = require("../../types");
const webdriver_1 = require("../webdriver");
const utils_1 = require("../utils");
const logger_1 = require("../logger");
const context_1 = require("../worker/context");
const storybook_helpers_js_1 = require("../storybook-helpers.js");
const browsers = {
    chromium: playwright_core_1.chromium,
    firefox: playwright_core_1.firefox,
    webkit: playwright_core_1.webkit,
};
async function tryConnect(type, gridUrl, timeoutMs) {
    let timeout = null;
    let isTimeout = false;
    let error = null;
    return Promise.race([
        new Promise((resolve) => (timeout = setTimeout(() => {
            isTimeout = true;
            (0, logger_1.logger)().error(`Can't connect to ${type.name()} playwright browser`, error);
            resolve(null);
        }, timeoutMs))),
        (async () => {
            let browser = null;
            do {
                try {
                    browser = await type.connect(gridUrl);
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (timeout)
                        clearTimeout(timeout);
                    break;
                }
                catch (e) {
                    error = e;
                }
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            } while (!isTimeout);
            return browser;
        })(),
    ]);
}
async function tryCreateBrowserContext(browser, options) {
    try {
        const context = await browser.newContext(options);
        const page = await context.newPage();
        return { context, page };
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('ffmpeg')) {
            (0, logger_1.logger)().warn('Failed to create browser context with video recording. Video recording will be disabled.');
            (0, logger_1.logger)().warn(error);
            const context = await browser.newContext({
                ...options,
                recordVideo: undefined,
            });
            const page = await context.newPage();
            return { context, page };
        }
        throw error;
    }
}
class InternalBrowser {
    #isShuttingDown = false;
    #browser;
    #context;
    #page;
    #pageErrors = [];
    #traceDir;
    #sessionId = (0, uuid_1.v4)();
    #debug;
    #storybookGlobals;
    #shouldReinit = false;
    constructor(browser, context, page, traceDir, debug = false, storybookGlobals) {
        this.#browser = browser;
        this.#context = context;
        this.#page = page;
        this.#traceDir = traceDir;
        this.#debug = debug;
        this.#storybookGlobals = storybookGlobals;
    }
    // TODO Expose #browser and #context in tests
    get browser() {
        return this.#page;
    }
    get sessionId() {
        return this.#sessionId;
    }
    recordPageError(error) {
        const message = error.stack ?? error.message;
        this.#pageErrors = [...this.#pageErrors.slice(-9), message];
        (0, logger_1.logger)().error(`Storybook page error: ${message}`);
    }
    async closeBrowser() {
        if (this.#isShuttingDown)
            return;
        this.#isShuttingDown = true;
        const teardown = [
            this.#debug ? () => this.#context.tracing.stop({ path: path_1.default.join(this.#traceDir, 'trace.zip') }) : null,
            () => this.#page.close(),
            this.#debug ? () => this.#page.video()?.saveAs(path_1.default.join(this.#traceDir, 'video.webm')) : null,
            () => this.#context.close(),
            () => this.#browser.close(),
            () => (0, context_1.removeWorkerContainer)(),
        ];
        for (const fn of teardown) {
            try {
                if (fn)
                    await fn();
            }
            catch {
                /* noop */
            }
        }
    }
    async takeScreenshot(captureElement, ignoreElements, options) {
        const ignore = Array.isArray(ignoreElements) ? ignoreElements : ignoreElements ? [ignoreElements] : [];
        const mask = ignore.map((el) => this.#page.locator(el));
        if (captureElement) {
            const element = await this.#page.$(captureElement);
            if (!element)
                throw new Error(`Element with selector ${captureElement} not found`);
            (0, logger_1.logger)().debug(`Capturing ${chalk_1.default.cyan(captureElement)} element`);
            return element.screenshot({
                style: ':root { overflow: hidden !important; }',
                animations: 'disabled',
                mask,
                ...options,
            });
        }
        (0, logger_1.logger)().debug('Capturing viewport screenshot');
        return this.#page.screenshot({ animations: 'disabled', mask, ...options });
    }
    async selectStory(id) {
        if (this.#shouldReinit) {
            this.#shouldReinit = false;
            const done = await this.initStorybook();
            if (!done)
                return;
        }
        await this.#page.evaluate(() => delete window.__CREEVEY_SELECT_STORY_RESULT__);
        await this.resetMousePosition();
        (0, logger_1.logger)().debug(`Triggering 'SetCurrentStory' event with storyId ${chalk_1.default.magenta(id)}`);
        const reloadWatcher = this.#page.waitForFunction((id) => id !== window.__CREEVEY_SESSION_ID__, this.#sessionId);
        const selectWatcher = this.#page.waitForFunction(() => window.__CREEVEY_SELECT_STORY_RESULT__);
        void this.#page.evaluate(storybook_helpers_js_1.selectStory, id);
        await Promise.race([reloadWatcher, selectWatcher]);
        let result = null;
        try {
            result = await this.#page.evaluate(() => window.__CREEVEY_SELECT_STORY_RESULT__);
        }
        catch (error) {
            // TODO: Debug why select watcher resolved, but we still fail with execution context destroyed
            // Maybe we need to wait for page to be fully loaded???
            if (error instanceof Error && error.message.includes('Execution context was destroyed')) {
                // Ignore error
            }
            else {
                throw error;
            }
        }
        if (!result) {
            (0, logger_1.logger)().debug('Storybook page has been reloaded during story selection');
            const done = await this.initStorybook();
            if (!done)
                return;
        }
        if (result?.status === 'error') {
            throw new Error(`Failed to select story: ${result.message}`);
        }
    }
    async updateStoryArgs(story, updatedArgs) {
        await this.#page.evaluate(([storyId, updatedArgs, UPDATE_STORY_ARGS, STORY_RENDERED]) => {
            return new Promise((resolve) => {
                // TODO Check if it's right way to wait for story to be rendered
                window.__STORYBOOK_ADDONS_CHANNEL__.once(STORY_RENDERED, resolve);
                window.__STORYBOOK_ADDONS_CHANNEL__.emit(UPDATE_STORY_ARGS, {
                    storyId,
                    updatedArgs,
                });
            });
        }, [story.id, updatedArgs, types_1.StorybookEvents.UPDATE_STORY_ARGS, types_1.StorybookEvents.STORY_RENDERED]);
    }
    async loadStoriesFromBrowser() {
        // @ts-expect-error TODO: Fix this
        return await this.#page.evaluate(storybook_helpers_js_1.getStories);
    }
    static async getBrowser(browserName, gridUrl, config, debug) {
        const browserConfig = config.browsers[browserName];
        const { storybookUrl: address = config.storybookUrl, viewport, 
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        _storybookGlobals, storybookGlobals = _storybookGlobals, seleniumCapabilities, playwrightOptions, connectionTimeout, } = browserConfig;
        // Use browser-specific timeout, or global config timeout, or default to 60000ms
        const connectionTimeoutMs = connectionTimeout ?? config.connectionTimeout ?? 60_000;
        const parsedUrl = new URL(gridUrl);
        const tracesDir = path_1.default.join(playwrightOptions?.tracesDir ?? path_1.default.join(config.reportDir, 'traces'), process.pid.toString());
        const cacheDir = await (0, utils_1.getCreeveyCache)();
        (0, assert_1.default)(cacheDir, "Couldn't get cache directory");
        let browser = null;
        if (parsedUrl.protocol === 'ws:') {
            browser = await tryConnect(browsers[(0, utils_1.resolvePlaywrightBrowserType)(browserConfig.browserName)], gridUrl, connectionTimeoutMs);
        }
        else if (parsedUrl.protocol === 'creevey:') {
            browser = await browsers[(0, utils_1.resolvePlaywrightBrowserType)(browserConfig.browserName)].launch({
                ...playwrightOptions,
                tracesDir: path_1.default.join(cacheDir, `${process.pid}`),
            });
        }
        else {
            if (browserConfig.browserName !== 'chrome') {
                (0, logger_1.logger)().error("Playwright's Selenium Grid feature supports only chrome browser");
                return null;
            }
            process.env.SELENIUM_REMOTE_URL = gridUrl;
            process.env.SELENIUM_REMOTE_CAPABILITIES = JSON.stringify(seleniumCapabilities);
            browser = await playwright_core_1.chromium.launch({ ...playwrightOptions, tracesDir: path_1.default.join(cacheDir, `${process.pid}`) });
        }
        if (!browser) {
            return null;
        }
        const { context, page } = await tryCreateBrowserContext(browser, {
            recordVideo: debug
                ? {
                    dir: path_1.default.join(cacheDir, `${process.pid}`),
                    size: viewport,
                }
                : undefined,
            screen: viewport,
            viewport,
        });
        if (debug) {
            await context.tracing.start(Object.assign({ screenshots: true, snapshots: true, sources: true }, playwrightOptions?.trace));
        }
        const internalBrowser = new InternalBrowser(browser, context, page, tracesDir, debug, storybookGlobals);
        page.on('pageerror', (error) => {
            internalBrowser.recordPageError(error);
        });
        if ((0, logger_1.logger)().getLevel() <= loglevel_1.default.levels.DEBUG) {
            page.on('console', (msg) => {
                (0, logger_1.logger)().debug(`Console message: ${msg.text()}`);
            });
        }
        try {
            if (utils_1.isShuttingDown.current)
                return null;
            const done = await internalBrowser.init({
                browserName,
                storybookUrl: address,
            });
            return done ? internalBrowser : null;
        }
        catch (originalError) {
            void internalBrowser.closeBrowser();
            const message = originalError instanceof Error ? originalError.message : originalError;
            const error = new Error(`Can't load storybook root page: ${message}`);
            if (originalError instanceof Error)
                error.stack = originalError.stack;
            (0, logger_1.logger)().error(error);
            return null;
        }
    }
    async init({ browserName, storybookUrl }) {
        const sessionId = this.#sessionId;
        loglevel_plugin_prefix_1.default.apply((0, logger_1.logger)(), {
            format(level) {
                const levelColor = logger_1.colors[level.toUpperCase()];
                return `[${browserName}:${chalk_1.default.gray(process.pid)}] ${levelColor(level)} => ${chalk_1.default.gray(sessionId)}`;
            },
        });
        this.#page.setDefaultTimeout(60000);
        await this.#page.addInitScript(() => {
            // Some Vite/esbuild outputs reference __name during module evaluation.
            // Define it before Storybook loads, otherwise the preview crashes before Creevey can initialize.
            // @ts-expect-error https://github.com/evanw/esbuild/issues/2605#issuecomment-2050808084
            window.__name = (func) => func;
            // @ts-expect-error Keep globalThis in sync for modules that read the helper directly.
            globalThis.__name = window.__name;
            requestAnimationFrame(check);
            function check() {
                if (document.readyState !== 'complete' ||
                    typeof window.__STORYBOOK_PREVIEW__ === 'undefined' ||
                    typeof window.__STORYBOOK_ADDONS_CHANNEL__ === 'undefined' ||
                    (!('ready' in window.__STORYBOOK_PREVIEW__) &&
                        window.__STORYBOOK_ADDONS_CHANNEL__.last('setGlobals') === undefined)) {
                    requestAnimationFrame(check);
                    return;
                }
                if ('ready' in window.__STORYBOOK_PREVIEW__) {
                    // NOTE: Storybook <= 7.x doesn't have ready() method
                    void window.__STORYBOOK_PREVIEW__.ready().then(() => (window.__CREEVYE_STORYBOOK_READY__ = true));
                }
                else {
                    window.__CREEVYE_STORYBOOK_READY__ = true;
                }
            }
        });
        return await (0, utils_1.runSequence)([() => this.openStorybookPage(storybookUrl), () => this.initStorybook()], () => !this.#isShuttingDown);
    }
    async initStorybook() {
        await this.#page.evaluate((id) => (window.__CREEVEY_SESSION_ID__ = id), this.#sessionId);
        return await (0, utils_1.runSequence)([() => this.waitForStorybook(), () => this.loadStorybookStories(), () => this.defineGlobals()], () => !this.#isShuttingDown);
    }
    async openStorybookPage(storybookUrl) {
        if (!webdriver_1.LOCALHOST_REGEXP.test(storybookUrl)) {
            await this.#page.goto((0, webdriver_1.appendIframePath)(storybookUrl));
            return;
        }
        try {
            const resolvedUrl = await (0, webdriver_1.resolveStorybookUrl)((0, webdriver_1.appendIframePath)(storybookUrl), (url) => this.checkUrl(url));
            await this.#page.goto(resolvedUrl);
        }
        catch (error) {
            (0, logger_1.logger)().error('Failed to resolve storybook URL', error instanceof Error ? error.message : '');
            throw error;
        }
    }
    async checkUrl(url) {
        const page = await this.#browser.newPage();
        try {
            (0, logger_1.logger)().debug(`Opening ${chalk_1.default.magenta(url)} and checking the page source`);
            const response = await page.goto(url, { waitUntil: 'commit' });
            const source = await response?.text();
            (0, logger_1.logger)().debug(`Checking ${chalk_1.default.cyan(`#${webdriver_1.storybookRootID}`)} existence on ${chalk_1.default.magenta(url)}`);
            return source?.includes(`id="${webdriver_1.storybookRootID}"`) ?? false;
        }
        catch {
            return false;
        }
        finally {
            await page.close();
        }
    }
    async waitForStorybook() {
        (0, logger_1.logger)().debug('Waiting for Storybook to initiate');
        try {
            await this.#page.waitForFunction(() => window.__CREEVYE_STORYBOOK_READY__);
        }
        catch (error) {
            const diagnostics = await this.collectStorybookDiagnostics();
            (0, logger_1.logger)().error(`Storybook readiness diagnostics: ${JSON.stringify(diagnostics)}`);
            throw error;
        }
    }
    async collectStorybookDiagnostics() {
        try {
            return await this.#page.evaluate(({ pageErrors, rootId }) => {
                const hasPreview = typeof window.__STORYBOOK_PREVIEW__ !== 'undefined';
                const hasChannel = typeof window.__STORYBOOK_ADDONS_CHANNEL__ !== 'undefined';
                return {
                    url: window.location.href,
                    readyState: document.readyState,
                    title: document.title,
                    storybookReady: window.__CREEVYE_STORYBOOK_READY__ === true,
                    hasPreview,
                    hasChannel,
                    previewHasReady: hasPreview && 'ready' in window.__STORYBOOK_PREVIEW__,
                    setGlobalsReceived: hasChannel ? window.__STORYBOOK_ADDONS_CHANNEL__.last('setGlobals') !== undefined : false,
                    globalsUpdatedReceived: hasChannel
                        ? window.__STORYBOOK_ADDONS_CHANNEL__.last('globalsUpdated') !== undefined
                        : false,
                    bodyTextSample: document.body?.innerText?.slice(0, 500) ?? null,
                    rootExists: document.getElementById(rootId) !== null,
                    pageErrors,
                };
            }, { pageErrors: this.#pageErrors, rootId: webdriver_1.storybookRootID });
        }
        catch (diagnosticsError) {
            return {
                url: this.#page.url(),
                pageErrors: this.#pageErrors,
                diagnosticsError: diagnosticsError instanceof Error ? diagnosticsError.message : diagnosticsError,
            };
        }
    }
    async loadStorybookStories() {
        (0, logger_1.logger)().debug('Loading Storybook stories');
        const storiesWatcher = this.#page.waitForFunction(() => window.__CREEVEY_STORYBOOK_STORIES__);
        const reloadWatcher = this.#page.waitForFunction((id) => id !== window.__CREEVEY_SESSION_ID__, this.#sessionId);
        void this.#page.evaluate(() => {
            void window.__STORYBOOK_PREVIEW__.extract().then((stories) => {
                window.__CREEVEY_STORYBOOK_STORIES__ = stories;
            });
        });
        const type = await Promise.race([storiesWatcher.then(() => 'stories'), reloadWatcher.then(() => 'reload')]);
        if (type === 'reload') {
            (0, logger_1.logger)().debug('Storybook page reloaded');
            await this.waitForStorybook();
        }
    }
    async resetMousePosition() {
        (0, logger_1.logger)().debug('Resetting mouse position to (0, 0)');
        await this.#page.mouse.move(0, 0);
    }
    async defineGlobals() {
        (0, logger_1.logger)().debug('Defining Storybook globals');
        const globalsWatcher = this.#page.waitForFunction(() => window.__CREEVEY_STORYBOOK_GLOBALS__);
        void this.#page.evaluate((userGlobals) => {
            if (userGlobals) {
                window.__STORYBOOK_ADDONS_CHANNEL__.once('globalsUpdated', ({ globals }) => {
                    window.__CREEVEY_STORYBOOK_GLOBALS__ = globals;
                });
                window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: userGlobals });
            }
            else {
                window.__CREEVEY_STORYBOOK_GLOBALS__ = {};
            }
        }, this.#storybookGlobals);
        await globalsWatcher;
    }
}
exports.InternalBrowser = InternalBrowser;
//# sourceMappingURL=internal.js.map