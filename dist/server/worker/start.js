"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const chai_1 = __importDefault(require("chai"));
const types_js_1 = require("../../types.js");
const messages_js_1 = require("../messages.js");
const chai_image_js_1 = __importDefault(require("./chai-image.js"));
const match_image_js_1 = require("./match-image.js");
const stories_js_1 = require("../stories.js");
const logger_js_1 = require("../logger.js");
const utils_js_1 = require("../utils.js");
async function getTestsFromStories(config, browserName, webdriver) {
    const testsById = new Map();
    const tests = await (0, stories_js_1.loadTestsFromStories)([browserName], 
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    (listener) => config.storiesProvider(config, listener, webdriver), (testsDiff) => {
        Object.entries(testsDiff).forEach(([id, newTest]) => {
            if (newTest)
                testsById.set(id, newTest);
            else
                testsById.delete(id);
        });
    });
    Object.values(tests)
        .filter(types_js_1.isDefined)
        .forEach((test) => testsById.set(test.id, test));
    return testsById;
}
function runHandler(browserName, result, error) {
    // TODO How handle browser corruption?
    const { images } = result;
    if (images != null && (0, types_js_1.isImageError)(error)) {
        if (typeof error.images == 'string') {
            const image = images[browserName];
            if (image)
                image.error = error.images;
        }
        else {
            const imageErrors = error.images ?? {};
            Object.keys(imageErrors).forEach((imageName) => {
                const image = images[imageName];
                if (image)
                    image.error = imageErrors[imageName];
            });
        }
    }
    if (error || (images != null && Object.values(images).some((image) => image?.error != null))) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const errorMessage = result.error;
        const isUnexpectedError = hasTimeout(errorMessage) ||
            hasDisconnected(errorMessage) ||
            (images != null && Object.values(images).some((image) => hasTimeout(image?.error)));
        if (isUnexpectedError)
            (0, messages_js_1.emitWorkerMessage)({ type: 'error', payload: { subtype: 'unknown', error: errorMessage } });
        else
            (0, messages_js_1.emitTestMessage)({
                type: 'end',
                payload: {
                    status: 'failed',
                    ...result,
                },
            });
    }
    else {
        (0, messages_js_1.emitTestMessage)({
            type: 'end',
            payload: {
                status: 'success',
                ...result,
            },
        });
    }
}
async function setupWebdriver(webdriver) {
    if ((await webdriver.openBrowser(true)) == null) {
        (0, logger_js_1.logger)().error('Failed to start browser');
        (0, messages_js_1.emitWorkerMessage)({
            type: 'error',
            payload: { subtype: 'browser', error: 'Failed to start browser' },
        });
        return;
    }
    const sessionId = await webdriver.getSessionId();
    return [sessionId, webdriver];
}
function serializeError(error) {
    if (!error)
        return 'Unknown error';
    if (error instanceof Error)
        return error.stack ?? error.message;
    return typeof error === 'object' ? JSON.stringify(error) : error;
}
function hasDisconnected(str) {
    return str?.toLowerCase().includes('disconnected') ?? false;
}
function hasTimeout(str) {
    return str?.toLowerCase().includes('timeout') ?? false;
}
async function start(browser, gridUrl, config, options) {
    const imagesContext = {
        attachments: [],
        testFullPath: [],
        images: {},
    };
    const Webdriver = config.webdriver;
    const [sessionId, webdriver] = (await setupWebdriver(new Webdriver(browser, gridUrl, config, options.debug ?? false))) ?? [];
    if (!webdriver || !sessionId)
        return;
    const { matchImage, matchImages } = options.odiff
        ? await (0, match_image_js_1.getOdiffMatchers)(imagesContext, config)
        : await (0, match_image_js_1.getMatchers)(imagesContext, config);
    chai_1.default.use((0, chai_image_js_1.default)(matchImage, matchImages));
    const tests = await (async () => {
        try {
            return await getTestsFromStories(config, browser, webdriver);
        }
        catch (error) {
            (0, logger_js_1.logger)().error('Failed to get tests from stories:', error);
            (0, messages_js_1.emitWorkerMessage)({
                type: 'error',
                payload: { subtype: 'browser', error: serializeError(error) },
            });
            return null;
        }
    })();
    if (!tests)
        return;
    (0, messages_js_1.subscribeOn)('test', (message) => {
        if (message.type != 'start')
            return;
        const test = tests.get(message.payload.id);
        if (!test) {
            const error = `Test with id ${message.payload.id} not found`;
            (0, logger_js_1.logger)().error(error);
            (0, messages_js_1.emitWorkerMessage)({
                type: 'error',
                payload: { subtype: 'test', error },
            });
            return;
        }
        const baseContext = {
            browserName: browser,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            get webdriver() {
                // @ts-expect-error We defined separate d.ts declarations for each webdriver
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return webdriver.browser;
            },
            screenshots: [],
            matchImage: matchImage,
            matchImages: matchImages,
            // NOTE: Deprecated
            expect: chai_1.default.expect,
        };
        imagesContext.attachments = [];
        imagesContext.testFullPath = (0, utils_js_1.getTestPath)(test);
        imagesContext.images = {};
        let error = undefined;
        void (async () => {
            let timeout;
            let isRejected = false;
            const start = Date.now();
            try {
                await Promise.race([
                    new Promise((_, reject) => (timeout = setTimeout(() => {
                        isRejected = true;
                        reject(new Error(`Timeout of ${config.testTimeout}ms exceeded`));
                    }, config.testTimeout))),
                    (async () => {
                        const context = await webdriver.switchStory(test.story, baseContext);
                        await test.fn(context);
                    })(),
                ]);
            }
            catch (testError) {
                error = testError;
            }
            const duration = Date.now() - start;
            clearTimeout(timeout);
            await webdriver.afterTest(test);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (isRejected) {
                (0, messages_js_1.emitWorkerMessage)({
                    type: 'error',
                    payload: { subtype: 'unknown', error: serializeError(error) },
                });
            }
            else {
                const result = {
                    sessionId,
                    browserName: baseContext.browserName,
                    workerId: process.pid,
                    images: imagesContext.images,
                    error: error ? serializeError(error) : undefined,
                    duration,
                    attachments: imagesContext.attachments,
                    retries: message.payload.retries,
                };
                runHandler(baseContext.browserName, result, error);
            }
        })().catch((error) => {
            (0, logger_js_1.logger)().error('Unexpected error:', error);
            (0, messages_js_1.emitWorkerMessage)({
                type: 'error',
                payload: { subtype: 'test', error: serializeError(error) },
            });
        });
    });
    (0, logger_js_1.logger)().info('Browser is ready');
    (0, messages_js_1.emitWorkerMessage)({ type: 'ready' });
}
//# sourceMappingURL=start.js.map