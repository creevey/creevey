"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStories = void 0;
const chokidar_1 = require("chokidar");
const fs_1 = require("fs");
const browser_js_1 = require("./browser.js");
const logger_js_1 = require("../logger.js");
const parser_js_1 = __importDefault(require("../testsFiles/parser.js"));
const utils_js_1 = require("../utils.js");
const index_js_1 = require("../../shared/index.js");
const loadStories = async (config, storiesListener, webdriver) => {
    let creeveyParamsByStoryId = {};
    const mergeParamsFromTestsToStory = (story, creeveyParams) => {
        if (story.parameters) {
            story.parameters.creevey = (0, index_js_1.combineParameters)(story.parameters.creevey ?? {}, creeveyParams);
        }
    };
    const stories = await (0, browser_js_1.loadStories)(config, (updatedStoriesByFiles) => {
        Array.from(updatedStoriesByFiles.entries()).forEach(([, storiesArray]) => {
            storiesArray.forEach((story) => {
                const creeveyParams = creeveyParamsByStoryId[story.id];
                if (creeveyParams)
                    mergeParamsFromTestsToStory(story, creeveyParams);
            });
        });
        storiesListener(updatedStoriesByFiles);
    }, webdriver);
    // TODO fix test files hot reloading
    creeveyParamsByStoryId = await parseParams(config /*, (data) => console.log(data) */);
    Object.entries(stories).forEach(([storyId, story]) => {
        const creeveyParams = creeveyParamsByStoryId[storyId];
        if (creeveyParams)
            mergeParamsFromTestsToStory(story, creeveyParams);
    });
    return stories;
};
exports.loadStories = loadStories;
// TODO Check if it works with watch
async function parseParams(config, listener) {
    if (!config.testsDir || !(0, fs_1.existsSync)(config.testsDir)) {
        return Promise.resolve({});
    }
    const testFiles = (0, utils_js_1.readDirRecursive)(config.testsDir).filter((file) => config.testsRegex?.test(file));
    if (listener) {
        (0, chokidar_1.watch)(testFiles).on('change', (filePath) => {
            (0, logger_js_1.logger)().debug(`changed: ${filePath}`);
            // doesn't work, always returns {} due modules caching
            // see https://github.com/nodejs/modules/issues/307
            void (0, parser_js_1.default)(testFiles).then((data) => {
                listener(data);
            });
        });
    }
    return (0, parser_js_1.default)(testFiles);
}
exports.loadStories.providerName = 'hybrid';
//# sourceMappingURL=hybrid.js.map