"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeStory = exports.deserializeRawStories = exports.serializeRawStories = exports.denormalizeStoryParameters = exports.combineParameters = void 0;
const mapValues_js_1 = __importDefault(require("lodash/mapValues.js"));
const mergeWith_js_1 = __importDefault(require("lodash/mergeWith.js"));
const cloneDeepWith_js_1 = __importDefault(require("lodash/cloneDeepWith.js"));
const serializeRegExp_js_1 = require("./serializeRegExp.js");
// NOTE: Copy-paste from storybook/api
const combineParameters = (...parameterSets) => 
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
(0, mergeWith_js_1.default)({}, ...parameterSets, (_, srcValue) => {
    // Treat arrays as scalars:
    if (Array.isArray(srcValue))
        return srcValue;
    return undefined;
});
exports.combineParameters = combineParameters;
// NOTE: Copy-paste from storybook/api
const denormalizeStoryParameters = ({ globalParameters, kindParameters, stories, }) => {
    return (0, mapValues_js_1.default)(stories, (storyData) => ({
        ...storyData,
        parameters: (0, exports.combineParameters)(globalParameters, kindParameters[storyData.title] ?? {}, storyData.parameters),
    }));
};
exports.denormalizeStoryParameters = denormalizeStoryParameters;
const serializeRawStories = (stories) => {
    return (0, mapValues_js_1.default)(stories, (storyData) => {
        const creevey = storyData.parameters.creevey;
        if (creevey?.skip) {
            return {
                ...storyData,
                parameters: {
                    ...storyData.parameters,
                    creevey: {
                        ...creevey,
                        skip: (0, cloneDeepWith_js_1.default)(creevey.skip, (value) => {
                            if ((0, serializeRegExp_js_1.isRegExp)(value)) {
                                return (0, serializeRegExp_js_1.serializeRegExp)(value);
                            }
                            return undefined;
                        }),
                    },
                },
            };
        }
        return storyData;
    });
};
exports.serializeRawStories = serializeRawStories;
const deserializeRawStories = (stories) => {
    return (0, mapValues_js_1.default)(stories, exports.deserializeStory);
};
exports.deserializeRawStories = deserializeRawStories;
const deserializeStory = (story) => {
    const creevey = story.parameters.creevey;
    if (creevey?.skip) {
        return {
            ...story,
            parameters: {
                ...story.parameters,
                creevey: {
                    ...creevey,
                    skip: (0, cloneDeepWith_js_1.default)(creevey.skip, (value) => {
                        if ((0, serializeRegExp_js_1.isSerializedRegExp)(value)) {
                            return (0, serializeRegExp_js_1.deserializeRegExp)(value);
                        }
                        return undefined;
                    }),
                },
            },
        };
    }
    return story;
};
exports.deserializeStory = deserializeStory;
//# sourceMappingURL=index.js.map