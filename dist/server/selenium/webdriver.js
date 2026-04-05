"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeleniumWebdriver = void 0;
const messages_js_1 = require("../messages.js");
const webdriver_js_1 = require("../webdriver.js");
const logger_js_1 = require("../logger.js");
const context_js_1 = require("../worker/context.js");
// TODO Update context interface through references
class SeleniumWebdriver extends webdriver_js_1.CreeveyWebdriverBase {
    #browser = null;
    #browserName;
    #gridUrl;
    #config;
    #debug;
    constructor(browser, gridUrl, config, debug) {
        super();
        this.#browserName = browser;
        this.#gridUrl = gridUrl;
        this.#config = config;
        this.#debug = debug;
        (0, messages_js_1.subscribeOn)('shutdown', () => {
            void this.#browser?.closeBrowser().finally(() => {
                void (0, context_js_1.removeWorkerContainer)().finally(() => process.exit());
            });
            this.#browser = null;
        });
    }
    get browser() {
        return this.#browser?.browser;
    }
    getSessionId() {
        if (!this.#browser) {
            throw new Error('Browser is not initialized');
        }
        return this.#browser.browser.getSession().then((session) => session.getId());
    }
    async openBrowser(fresh = false) {
        if (this.#browser) {
            if (fresh) {
                await this.#browser.closeBrowser();
                this.#browser = null;
            }
            else {
                return this;
            }
        }
        const internalModule = await (async () => {
            try {
                return await import('./internal.js');
            }
            catch (error) {
                (0, logger_js_1.logger)().error(error);
                return null;
            }
        })();
        if (!internalModule)
            return null;
        const { InternalBrowser } = internalModule;
        const browser = await InternalBrowser.getBrowser(this.#browserName, this.#gridUrl, this.#config, this.#debug);
        if (!browser)
            return null;
        this.#browser = browser;
        return this;
    }
    async closeBrowser() {
        if (this.#browser) {
            await this.#browser.closeBrowser();
            this.#browser = null;
        }
    }
    async loadStoriesFromBrowser() {
        if (!this.#browser) {
            throw new Error('Browser is not initialized');
        }
        return this.#browser.loadStoriesFromBrowser();
    }
    async afterTest() {
        if (!this.#browser) {
            throw new Error('Browser is not initialized');
        }
        return this.#browser.afterTest();
    }
    async takeScreenshot(captureElement, ignoreElements) {
        if (!this.#browser) {
            throw new Error('Browser is not initialized');
        }
        return this.#browser.takeScreenshot(captureElement, ignoreElements);
    }
    async selectStory(id) {
        if (!this.#browser) {
            throw new Error('Browser is not initialized');
        }
        return this.#browser.selectStory(id);
    }
    async updateStoryArgs(story, updatedArgs) {
        if (!this.#browser) {
            throw new Error('Browser is not initialized');
        }
        return this.#browser.updateStoryArgs(story, updatedArgs);
    }
}
exports.SeleniumWebdriver = SeleniumWebdriver;
//# sourceMappingURL=webdriver.js.map