"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForStorybookReady = waitForStorybookReady;
const types_1 = require("../types");
async function waitForStorybookReady(page, timeout = 60000) {
    const isStorybookInitialized = await page.evaluate(({ timeout, event }) => {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = timeout / 100;
            function check() {
                if (typeof window.__STORYBOOK_ADDONS_CHANNEL__ !== 'undefined' &&
                    window.__STORYBOOK_ADDONS_CHANNEL__.last(event) !== undefined) {
                    resolve(true);
                }
                else if (attempts++ < maxAttempts) {
                    setTimeout(check, 100);
                }
                else {
                    reject(new Error('Storybook initialization timed out. Required Storybook functions not found on window.'));
                }
            }
            check();
        });
    }, { timeout, event: types_1.StorybookEvents.SET_GLOBALS });
    if (!isStorybookInitialized) {
        throw new Error('Failed to confirm Storybook API is ready after extended wait.');
    }
}
//# sourceMappingURL=helpers.js.map