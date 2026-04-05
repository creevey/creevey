"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const assert_1 = __importDefault(require("assert"));
const promises_1 = require("fs/promises");
const test_1 = require("@playwright/test");
const utils_1 = require("../server/utils");
const webdriver_1 = require("../server/webdriver");
const helpers_1 = require("./helpers");
// This function will fetch stories and cache them or an error if fetching fails.
// It's intended to be called once before tests that depend on stories are defined.
async function ensureStoriesFetched(page, storybookUrl) {
    try {
        console.log(`Fetching stories from: ${storybookUrl}`);
        await page.goto((0, webdriver_1.appendIframePath)(storybookUrl), { waitUntil: 'networkidle', timeout: 60000 });
        await (0, helpers_1.waitForStorybookReady)(page);
        // TODO: Inline `serializeRawStories` to serialize creevey skip parameters
        const fetchedStories = await page.evaluate(() => window.__STORYBOOK_PREVIEW__.extract());
        if (!fetchedStories || Object.keys(fetchedStories).length === 0) {
            throw new Error('No stories were found or cached from Storybook.');
        }
        console.log(`Successfully fetched and cached ${Object.keys(fetchedStories).length} stories.`);
        return fetchedStories;
    }
    catch (error) {
        console.error('Error fetching stories');
        throw error;
    }
}
const browsers = {
    chromium: test_1.chromium,
    firefox: test_1.firefox,
    webkit: test_1.webkit,
};
// TODO: Setup should generate test files for each story file (component)
// TODO: Add support for multiple storybook urls
async function globalSetup(config) {
    const storybookUrl = config.webServer?.url;
    const { defaultBrowserType = 'chromium', browserName = defaultBrowserType } = config.projects[0].use;
    (0, assert_1.default)(storybookUrl, 'Storybook URL is required');
    const cacheDir = await (0, utils_1.getCreeveyCache)();
    (0, assert_1.default)(cacheDir, 'Cache directory not found');
    await (0, promises_1.mkdir)(cacheDir, { recursive: true });
    process.env.CREEVEY_CACHE_DIR = cacheDir;
    const browser = await browsers[browserName].launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    if (process.env.PWDEBUG) {
        await context.tracing.start({ name: 'storybook-setup' });
    }
    try {
        const stories = await ensureStoriesFetched(page, storybookUrl);
        await (0, promises_1.writeFile)(path_1.default.join(cacheDir, 'stories.json'), JSON.stringify(stories, null, 2));
    }
    catch (error) {
        console.error('Error in globalSetup:', error);
        if (process.env.PWDEBUG) {
            const tracePath = path_1.default.join(cacheDir, 'storybook-setup-trace.zip');
            console.log('Trace is saved to:', tracePath);
            await context.tracing.stop({ path: tracePath });
        }
        throw error;
    }
    finally {
        await browser.close();
    }
}
exports.default = globalSetup;
//# sourceMappingURL=setup.js.map