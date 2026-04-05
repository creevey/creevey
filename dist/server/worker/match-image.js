"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchers = getMatchers;
exports.getOdiffMatchers = getOdiffMatchers;
const types_js_1 = require("../../types.js");
const compare_js_1 = require("../compare.js");
function toBuffer(bufferOrBase64) {
    return typeof bufferOrBase64 === 'string' ? Buffer.from(bufferOrBase64, 'base64') : bufferOrBase64;
}
async function getMatchers(ctx, config) {
    // TODO Replace with `import from`
    const { default: pixelmatch } = await import('pixelmatch');
    const pixelmatchConfig = {
        screenDir: config.screenDir,
        reportDir: config.reportDir,
        diffOptions: config.diffOptions,
        reportOnlyFailedTests: config.experimental?.reportOnlyFailedTests,
    };
    const assertImage = (0, compare_js_1.getPixelmatchAssert)(pixelmatch, ctx, pixelmatchConfig);
    return {
        matchImage: async (image, imageName) => {
            const errorMessage = await assertImage(toBuffer(image), imageName);
            if (errorMessage) {
                throw createImageError(imageName ? { [imageName]: errorMessage } : errorMessage);
            }
        },
        matchImages: async (images) => {
            const errors = {};
            await Promise.all(Object.entries(images).map(async ([imageName, image]) => {
                const errorMessage = await assertImage(toBuffer(image), imageName);
                if (errorMessage) {
                    errors[imageName] = errorMessage;
                }
            }));
            if (Object.keys(errors).length > 0) {
                throw createImageError(errors);
            }
        },
    };
}
function createImageError(imageErrors) {
    const error = new types_js_1.ImagesError('Expected image to match');
    error.images = imageErrors;
    return error;
}
async function getOdiffMatchers(ctx, config) {
    const { compare } = await import('odiff-bin');
    const assertImage = (0, compare_js_1.getOdiffAssert)(compare, ctx, config);
    return {
        matchImage: async (image, imageName) => {
            const errorMessage = await assertImage(toBuffer(image), imageName);
            if (errorMessage) {
                throw createImageError(imageName ? { [imageName]: errorMessage } : errorMessage);
            }
        },
        matchImages: async (images) => {
            const errors = {};
            await Promise.all(Object.entries(images).map(async ([imageName, image]) => {
                const errorMessage = await assertImage(toBuffer(image), imageName);
                if (errorMessage) {
                    errors[imageName] = errorMessage;
                }
            }));
            if (Object.keys(errors).length > 0) {
                throw createImageError(errors);
            }
        },
    };
}
//# sourceMappingURL=match-image.js.map