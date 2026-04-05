"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_EVENTS = exports.ImagesError = exports.StorybookEvents = void 0;
exports.noop = noop;
exports.isDefined = isDefined;
exports.isTest = isTest;
exports.isObject = isObject;
exports.isString = isString;
exports.isFunction = isFunction;
exports.isImageError = isImageError;
exports.isProcessMessage = isProcessMessage;
exports.isWorkerMessage = isWorkerMessage;
exports.isStoriesMessage = isStoriesMessage;
exports.isTestMessage = isTestMessage;
var StorybookEvents;
(function (StorybookEvents) {
    StorybookEvents["SET_STORIES"] = "setStories";
    StorybookEvents["SET_CURRENT_STORY"] = "setCurrentStory";
    StorybookEvents["FORCE_REMOUNT"] = "forceRemount";
    StorybookEvents["STORY_RENDERED"] = "storyRendered";
    StorybookEvents["STORY_ERRORED"] = "storyErrored";
    StorybookEvents["STORY_THREW_EXCEPTION"] = "storyThrewException";
    StorybookEvents["UPDATE_STORY_ARGS"] = "updateStoryArgs";
    StorybookEvents["SET_GLOBALS"] = "setGlobals";
    StorybookEvents["UPDATE_GLOBALS"] = "updateGlobals";
})(StorybookEvents || (exports.StorybookEvents = StorybookEvents = {}));
class ImagesError extends Error {
    images;
}
exports.ImagesError = ImagesError;
var TEST_EVENTS;
(function (TEST_EVENTS) {
    TEST_EVENTS["RUN_BEGIN"] = "start";
    TEST_EVENTS["RUN_END"] = "end";
    TEST_EVENTS["SUITE_BEGIN"] = "suite";
    TEST_EVENTS["SUITE_END"] = "suite end";
    TEST_EVENTS["TEST_BEGIN"] = "test";
    TEST_EVENTS["TEST_END"] = "test end";
    TEST_EVENTS["TEST_FAIL"] = "fail";
    TEST_EVENTS["TEST_PASS"] = "pass";
})(TEST_EVENTS || (exports.TEST_EVENTS = TEST_EVENTS = {}));
function noop() {
    /* noop */
}
function isDefined(value) {
    return value !== null && value !== undefined;
}
function isTest(x) {
    return (isDefined(x) &&
        isObject(x) &&
        'id' in x &&
        'storyId' in x &&
        typeof x.id == 'string' &&
        typeof x.storyId == 'string');
}
function isObject(x) {
    return typeof x == 'object' && x != null;
}
function isString(x) {
    return typeof x == 'string';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFunction(x) {
    return typeof x == 'function';
}
function isImageError(error) {
    return error instanceof ImagesError && 'images' in error;
}
function isProcessMessage(message) {
    return isObject(message) && 'scope' in message;
}
function isWorkerMessage(message) {
    return isProcessMessage(message) && message.scope == 'worker';
}
function isStoriesMessage(message) {
    return isProcessMessage(message) && message.scope == 'stories';
}
function isTestMessage(message) {
    return isProcessMessage(message) && message.scope == 'test';
}
//# sourceMappingURL=types.js.map