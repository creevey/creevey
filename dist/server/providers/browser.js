"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStories = void 0;
const cluster_1 = __importDefault(require("cluster"));
const messages_js_1 = require("../messages.js");
const types_js_1 = require("../../types.js");
const logger_js_1 = require("../logger.js");
const index_js_1 = require("../../shared/index.js");
// TODO Don't have updates from stories
const loadStories = async (_config, storiesListener, webdriver) => {
    if (cluster_1.default.isPrimary) {
        return new Promise((resolve) => {
            const worker = Object.values(cluster_1.default.workers ?? {})
                .filter(types_js_1.isDefined)
                .find((worker) => worker.isConnected());
            if (worker) {
                const unsubscribe = (0, messages_js_1.subscribeOnWorker)(worker, 'stories', (message) => {
                    if (message.type == 'set') {
                        const { stories, oldTests } = message.payload;
                        if (oldTests.length > 0)
                            (0, logger_js_1.logger)().warn(`If you use browser stories provider of CSFv3 Storybook feature\n` +
                                `Creevey will not load tests defined in story parameters from following stories:\n` +
                                oldTests.join('\n'));
                        unsubscribe();
                        resolve((0, index_js_1.deserializeRawStories)(stories));
                    }
                });
                (0, messages_js_1.sendStoriesMessage)(worker, { type: 'get' });
            }
            (0, messages_js_1.subscribeOn)('stories', (message) => {
                // TODO updates only one browser :(
                if (message.type == 'update')
                    storiesListener(new Map(message.payload));
            });
        });
    }
    else {
        (0, messages_js_1.subscribeOn)('stories', (message) => {
            if (message.type == 'get')
                (0, messages_js_1.emitStoriesMessage)({ type: 'set', payload: { stories: rawStories, oldTests: storiesWithOldTests } });
            if (message.type == 'update')
                storiesListener(new Map(message.payload));
        });
        const rawStories = (await webdriver?.loadStoriesFromBrowser()) ?? {};
        const stories = (0, index_js_1.deserializeRawStories)(rawStories);
        const storiesWithOldTests = [];
        Object.values(stories).forEach((story) => {
            if (story.parameters?.creevey?.tests) {
                delete story.parameters?.creevey?.tests;
                storiesWithOldTests.push(`${story.title}/${story.name}`);
            }
        });
        return stories;
    }
};
exports.loadStories = loadStories;
exports.loadStories.providerName = 'browser';
//# sourceMappingURL=browser.js.map