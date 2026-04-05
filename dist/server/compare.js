"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPixelmatchAssert = getPixelmatchAssert;
exports.getOdiffAssert = getOdiffAssert;
const path_1 = __importDefault(require("path"));
const assert_1 = __importDefault(require("assert"));
const pngjs_1 = require("pngjs");
const promises_1 = require("fs/promises");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GIT_LFS_POINTER_PREFIX = 'version https://git-lfs.github.com/spec/v1';
async function getStat(filePath) {
    try {
        return await (0, promises_1.stat)(filePath);
    }
    catch (error) {
        if (typeof error == 'object' && error && error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}
async function getLastImageNumber(imageDir, imageName) {
    const actualImagesRegexp = new RegExp(`${imageName}-actual-(\\d+)\\.png`);
    try {
        return ((await (0, promises_1.readdir)(imageDir))
            .map((filename) => filename.replace(actualImagesRegexp, '$1'))
            .map(Number)
            .filter((x) => !isNaN(x))
            .sort((a, b) => b - a)[0] ?? 0);
    }
    catch {
        return 0;
    }
}
async function readExpected(expectImageDir, imageName) {
    const filePath = path_1.default.join(expectImageDir, `${imageName}.png`);
    const expected = await (0, promises_1.readFile)(filePath);
    assertValidPng(expected, `Expected image '${filePath}'`);
    return expected;
}
async function saveImages(imageDir, images) {
    const files = [];
    await (0, promises_1.mkdir)(imageDir, { recursive: true });
    for (const { name, data } of images) {
        const filePath = path_1.default.join(imageDir, name);
        await (0, promises_1.writeFile)(filePath, data);
        files.push(filePath);
    }
    return files;
}
async function getImagePaths(config, testFullPath, assertImageName) {
    const testPath = [...testFullPath];
    const imageName = assertImageName ?? testPath.pop();
    (0, assert_1.default)(typeof imageName === 'string', `Can't get image name from empty test scope`);
    const expectImageDir = path_1.default.join(config.screenDir, ...testPath);
    const reportImageDir = path_1.default.join(config.reportDir, ...testPath);
    const imageNumber = (await getLastImageNumber(reportImageDir, imageName)) + 1;
    const actualImageName = `${imageName}-actual-${imageNumber}.png`;
    const expectImageName = `${imageName}-expect-${imageNumber}.png`;
    const diffImageName = `${imageName}-diff-${imageNumber}.png`;
    return { imageName, actualImageName, expectImageName, diffImageName, expectImageDir, reportImageDir };
}
async function getExpected(ctx, { imageName, actualImageName, expectImageName, diffImageName, expectImageDir, reportImageDir }) {
    const onCompare = async (actual, expect, diff) => {
        const imagesMeta = [];
        const image = (ctx.images[imageName] = ctx.images[imageName] ?? { actual: actualImageName });
        imagesMeta.push({ name: image.actual, data: actual });
        if (diff && expect) {
            image.expect = expectImageName;
            image.diff = diffImageName;
            imagesMeta.push({ name: image.expect, data: expect });
            imagesMeta.push({ name: image.diff, data: diff });
        }
        ctx.attachments = await saveImages(reportImageDir, imagesMeta);
    };
    const expectImageStat = await getStat(path_1.default.join(expectImageDir, `${imageName}.png`));
    if (!expectImageStat)
        return { expected: null, onCompare };
    const expected = await readExpected(expectImageDir, imageName);
    return { expected, onCompare };
}
async function getOdiffExpected(ctx, actual, { imageName, actualImageName, expectImageName, diffImageName, expectImageDir, reportImageDir }) {
    const expected = await readExpected(expectImageDir, imageName);
    const image = (ctx.images[imageName] = ctx.images[imageName] ?? { actual: actualImageName });
    image.expect = expectImageName;
    image.diff = diffImageName;
    const imagesMeta = [
        { name: image.actual, data: actual },
        { name: expectImageName, data: expected },
    ];
    ctx.attachments = await saveImages(reportImageDir, imagesMeta);
    return {
        actual: path_1.default.join(reportImageDir, actualImageName),
        expect: path_1.default.join(reportImageDir, expectImageName),
        diff: path_1.default.join(reportImageDir, diffImageName),
    };
}
function normalizeImageSize(image, width, height) {
    const normalizedImage = Buffer.alloc(4 * width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (x < image.width && y < image.height) {
                const j = (y * image.width + x) * 4;
                normalizedImage[i + 0] = image.data[j + 0];
                normalizedImage[i + 1] = image.data[j + 1];
                normalizedImage[i + 2] = image.data[j + 2];
                normalizedImage[i + 3] = image.data[j + 3];
            }
            else {
                normalizedImage[i + 0] = 0;
                normalizedImage[i + 1] = 0;
                normalizedImage[i + 2] = 0;
                normalizedImage[i + 3] = 0;
            }
        }
    }
    return normalizedImage;
}
function hasDiffPixels(diff) {
    for (let i = 0; i < diff.length; i += 4) {
        if (diff[i + 0] == 255 && diff[i + 1] == 0 && diff[i + 2] == 0 && diff[i + 3] == 255)
            return true;
    }
    return false;
}
function assertValidPng(image, label) {
    if (image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE))
        return;
    const textPreview = image.subarray(0, 128).toString('utf-8');
    if (textPreview.startsWith(GIT_LFS_POINTER_PREFIX)) {
        throw new Error(`${label} is a Git LFS pointer, not a PNG. Run 'git lfs pull' to download screenshot fixtures.`);
    }
    throw new Error(`${label} is not a valid PNG file.`);
}
function compareImages(expect, actual, pixelmatch, diffOptions) {
    assertValidPng(expect, 'Expected image buffer');
    assertValidPng(actual, 'Actual image buffer');
    const expectImage = pngjs_1.PNG.sync.read(expect);
    const actualImage = pngjs_1.PNG.sync.read(actual);
    const width = Math.max(actualImage.width, expectImage.width);
    const height = Math.max(actualImage.height, expectImage.height);
    const diffImage = new pngjs_1.PNG({ width, height });
    let actualImageData = actualImage.data;
    if (actualImage.width < width || actualImage.height < height) {
        actualImageData = normalizeImageSize(actualImage, width, height);
    }
    let expectImageData = expectImage.data;
    if (expectImage.width < width || expectImage.height < height) {
        expectImageData = normalizeImageSize(expectImage, width, height);
    }
    pixelmatch(expectImageData, actualImageData, diffImage.data, width, height, diffOptions);
    return {
        isEqual: !hasDiffPixels(diffImage.data),
        diff: pngjs_1.PNG.sync.write(diffImage),
    };
}
function getPixelmatchAssert(pixelmatch, ctx, config) {
    return async function assertImagePixelmatch(actual, imageName) {
        const { expected, onCompare } = await getExpected(ctx, await getImagePaths(config, ctx.testFullPath, imageName));
        if (expected == null) {
            await onCompare(actual);
            return imageName ? `Expected image '${imageName}' does not exists` : 'Expected image does not exists';
        }
        if (actual.equals(expected)) {
            if (!config.reportOnlyFailedTests) {
                await onCompare(actual);
            }
            return;
        }
        const { isEqual, diff } = compareImages(expected, actual, pixelmatch, config.diffOptions);
        if (isEqual) {
            if (!config.reportOnlyFailedTests) {
                await onCompare(actual);
            }
            return;
        }
        await onCompare(actual, expected, diff);
        return imageName ? `Expected image '${imageName}' to match` : 'Expected image to match';
    };
}
function getOdiffAssert(compare, ctx, config) {
    const diffOptions = {
        ...config.odiffOptions,
        noFailOnFsErrors: true,
    };
    return async function assertImage(image, imageName) {
        const { actual, expect, diff } = await getOdiffExpected(ctx, image, await getImagePaths(config, ctx.testFullPath, imageName));
        const result = await compare(actual, expect, diff, diffOptions);
        if (!result.match) {
            if (result.reason == 'file-not-exists') {
                return imageName ? `Expected image '${imageName}' does not exists` : 'Expected image does not exists';
            }
            return imageName ? `Expected image '${imageName}' to match` : 'Expected image to match';
        }
    };
}
//# sourceMappingURL=compare.js.map