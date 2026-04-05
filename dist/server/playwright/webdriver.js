"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightWebdriver = void 0;
const logger_1 = require("../logger");
const messages_1 = require("../messages");
const webdriver_1 = require("../webdriver");
class PlaywrightWebdriver extends webdriver_1.CreeveyWebdriverBase {
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
        (0, messages_1.subscribeOn)('shutdown', () => {
            void this.#browser?.closeBrowser().finally(() => process.exit());
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
        return Promise.resolve(this.#browser.sessionId);
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
                (0, logger_1.logger)().error(error);
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
    afterTest() {
        return Promise.resolve(undefined);
    }
    async takeScreenshot(captureElement, ignoreElements, options) {
        if (!this.#browser) {
            throw new Error('Browser is not initialized');
        }
        return this.#browser.takeScreenshot(captureElement, ignoreElements, options);
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
exports.PlaywrightWebdriver = PlaywrightWebdriver;
//# sourceMappingURL=webdriver.js.map