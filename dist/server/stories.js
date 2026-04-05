"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTestsFromStories = loadTestsFromStories;
const crypto_1 = require("crypto");
const types_js_1 = require("../types.js");
const utils_js_1 = require("./utils.js");
function storyTestFabric(delay, testFn) {
    return async function storyTest(context) {
        if (delay)
            await new Promise((resolve) => setTimeout(resolve, delay));
        await (testFn
            ? testFn(context)
            : context.screenshots.length > 0
                ? context.matchImages(context.screenshots.reduce((screenshots, { imageName, screenshot }, index) => ({
                    ...screenshots,
                    [imageName ?? `screenshot_${index}`]: screenshot,
                }), {}))
                : context.matchImage(await context.takeScreenshot()));
    };
}
function createCreeveyTest(browser, storyMeta, skipOptions, testName) {
    const { title, name, id: storyId } = storyMeta;
    const testPath = [title, name, testName, browser].filter(types_js_1.isDefined);
    const skip = skipOptions ? (0, utils_js_1.shouldSkip)(browser, { title, name }, skipOptions, testName) : false;
    const id = (0, crypto_1.createHash)('sha1').update(testPath.join('/')).digest('hex');
    return {
        id,
        skip,
        browser,
        testName,
        storyPath: [...title.split('/').map((x) => x.trim()), name],
        storyId,
    };
}
function convertStories(browserName, stories) {
    const tests = {};
    (Array.isArray(stories) ? stories : Object.values(stories)).forEach((storyMeta) => {
        // TODO Skip docsOnly stories for now
        if (storyMeta.parameters.docsOnly)
            return;
        const { delay: delayParam, tests: storyTests, skip } = (storyMeta.parameters.creevey ?? {});
        const delay = typeof delayParam == 'number' ? delayParam : delayParam?.for.includes(browserName) ? delayParam.ms : 0;
        // typeof tests === "undefined" => rootSuite -> kindSuite -> storyTest -> [browsers.png]
        // typeof tests === "function"  => rootSuite -> kindSuite -> storyTest -> browser -> [images.png]
        // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
        // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> browser -> [images.png]
        if (!storyTests) {
            const test = createCreeveyTest(browserName, storyMeta, skip);
            tests[test.id] = { ...test, storyId: storyMeta.id, story: storyMeta, fn: storyTestFabric(delay) };
            return;
        }
        Object.entries(storyTests).forEach(([testName, testFn]) => {
            const test = createCreeveyTest(browserName, storyMeta, skip, testName);
            tests[test.id] = { ...test, storyId: storyMeta.id, story: storyMeta, fn: storyTestFabric(delay, testFn) };
        });
    });
    return tests;
}
async function loadTestsFromStories(browsers, provider, update) {
    const testIdsByFiles = new Map();
    const stories = await provider((storiesByFiles) => {
        const testsDiff = {};
        const tests = {};
        browsers.forEach((browser) => {
            Array.from(storiesByFiles.entries()).forEach(([filename, stories]) => {
                Object.assign(tests, convertStories(browser, stories));
                const changed = Object.keys(tests);
                const removed = testIdsByFiles.get(filename)?.filter((testId) => !tests[testId]) ?? [];
                if (changed.length == 0)
                    testIdsByFiles.delete(filename);
                else
                    testIdsByFiles.set(filename, changed);
                Object.assign(testsDiff, tests);
                removed.forEach((testId) => (testsDiff[testId] = undefined));
            });
        });
        update?.(testsDiff);
    });
    const tests = browsers.reduce((tests, browser) => Object.assign(tests, convertStories(browser, stories)), {});
    Object.values(tests)
        .filter(types_js_1.isDefined)
        .forEach(({ id, story: { parameters: { fileName }, }, }) => 
    // TODO Don't use filename as a key, due possible collisions if two require.context with same structure of modules are defined
    testIdsByFiles.set(fileName, [...(testIdsByFiles.get(fileName) ?? []), id]));
    return tests;
}
//# sourceMappingURL=stories.js.map