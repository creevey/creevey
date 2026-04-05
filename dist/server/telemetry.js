"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendScreenshotsCount = sendScreenshotsCount;
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const shelljs_1 = require("shelljs");
const qs_1 = require("qs");
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const url_1 = require("url");
const module_1 = require("module");
const types_js_1 = require("../types.js");
const konturGitHost = 'git.skbkontur.ru';
const trackId = 232; // front_infra
const origin = 'http://localhost/';
const category = 'tests_run';
const action = 'done';
function buildPathname(label, info) {
    return `/track-event?${(0, qs_1.stringify)({
        id: trackId,
        c: category,
        a: action,
        l: label,
        cv: JSON.stringify(info),
        ts: new Date().toISOString(),
        url: origin,
    })}`;
}
function sanitizeGridUrl(gridUrl) {
    const url = new URL(gridUrl);
    url.username = url.username ? '********' : '';
    url.password = url.password ? '********' : '';
    return url.toString();
}
function tryGetRepoUrl() {
    try {
        const gitRemoteOutput = (0, shelljs_1.exec)('git remote -v', { silent: true });
        const [, repoUrl] = /origin\s+(.*)\s+\(fetch\)/.exec(gitRemoteOutput.stdout) ?? [];
        return [repoUrl, null];
    }
    catch (error) {
        return [undefined, error];
    }
}
function tryGetRootPath() {
    try {
        const gitRevParseOutput = (0, shelljs_1.exec)('git rev-parse --show-toplevel', { silent: true });
        return [gitRevParseOutput.stdout.trim(), null];
    }
    catch (error) {
        return [undefined, error];
    }
}
function tryGetStorybookVersion() {
    try {
        const storybookPackageOutput = (0, shelljs_1.exec)(`node -e "console.log(JSON.stringify(require('storybook/package.json')))"`, {
            silent: true,
        });
        const storybookPackage = JSON.parse(storybookPackageOutput.stdout);
        return [storybookPackage.version, null];
    }
    catch (error) {
        return [undefined, error];
    }
}
function tryGetCreeveyVersion() {
    try {
        const importMetaUrl = (0, url_1.pathToFileURL)(__filename).href;
        const _require = (0, module_1.createRequire)(importMetaUrl);
        const creeveyPackage = _require('creevey/package.json');
        return [creeveyPackage.version, null];
    }
    catch (error) {
        return [undefined, error];
    }
}
function sendRequest(options) {
    return new Promise((resolve, reject) => {
        const req = https_1.default.request(options, (res) => {
            if (res.statusCode) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                }
                else if (res.statusCode >= 300 && res.statusCode < 400) {
                    reject(new Error(`Redirection error: ${res.statusCode}`));
                }
                else if (res.statusCode >= 400 && res.statusCode < 500) {
                    reject(new Error(`Client error: ${res.statusCode}`));
                }
                else if (res.statusCode >= 500 && res.statusCode < 600) {
                    reject(new Error(`Server error: ${res.statusCode}`));
                }
                else {
                    reject(new Error(`Unexpected status code: ${res.statusCode}`));
                }
            }
            else {
                reject(new Error('No status code received'));
            }
        });
        req.on('error', reject);
        req.end();
    });
}
async function sendScreenshotsCount(config, options, status) {
    const [repoUrl] = tryGetRepoUrl();
    const isKonturRepo = repoUrl?.includes(konturGitHost);
    if (!isKonturRepo || config.disableTelemetry)
        return;
    const uuid = (0, uuid_1.v4)();
    const [creeveyVersion, creeveyVersionError] = tryGetCreeveyVersion();
    const [storybookVersion, storybookVersionError] = tryGetStorybookVersion();
    const [gitRootPath] = tryGetRootPath();
    const gridUrl = config.gridUrl ? sanitizeGridUrl(config.gridUrl) : undefined;
    const configMeta = {
        runId: uuid,
        repoUrl: repoUrl ?? 'unknown',
        creeveyVersion: creeveyVersion ?? 'unknown',
        storybookVersion: storybookVersion ?? 'unknown',
        options,
        gridUrl,
        screenDir: config.screenDir ? path_1.default.relative(gitRootPath ?? process.cwd(), config.screenDir) : undefined,
        useDocker: config.useDocker,
        dockerImage: config.dockerImage,
        maxRetries: config.maxRetries,
        diffOptions: config.diffOptions,
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        storiesProvider: config.storiesProvider?.providerName ?? 'unknown',
        errors: [creeveyVersionError, storybookVersionError].some(Boolean)
            ? [
                creeveyVersionError ? `Error while getting creevey version: ${creeveyVersionError.message}` : undefined,
                storybookVersionError ? `Error while getting storybook version: ${storybookVersionError.message}` : undefined,
            ].filter(Boolean)
            : undefined,
    };
    const browsersMeta = {
        runId: uuid,
        browsers: Object.fromEntries(Object.entries(config.browsers ?? {}).map(([name, browser]) => [
            name,
            typeof browser === 'object'
                ? {
                    name: name,
                    gridUrl: browser.gridUrl ? sanitizeGridUrl(browser.gridUrl) : undefined,
                    browserName: browser.browserName,
                    // @ts-expect-error Support old config version
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    browserVersion: browser.seleniumCapabilities?.browserVersion ?? browser.browserVersion,
                    // @ts-expect-error Support old config version
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    platformName: browser.seleniumCapabilities?.platformName ?? browser.platformName,
                    viewport: browser.viewport,
                    limit: browser.limit,
                    dockerImage: browser.dockerImage,
                    'se:teamname': browser.seleniumCapabilities?.['se:teamname'],
                }
                : browser,
        ])),
    };
    const tests = {};
    Object.values(status?.tests ?? {})
        .filter(types_js_1.isDefined)
        .forEach((test) => {
        (0, lodash_1.set)(tests, [...test.storyPath, test.testName, test.browser].filter(types_js_1.isDefined), test.id);
    });
    const testsMeta = { runId: uuid, tests };
    const fullPathname = buildPathname('tests', testsMeta);
    // NOTE: Keep request path shorter than 24k symbols
    const chunksCount = Math.ceil(fullPathname.length / 24_000);
    let chunks = [];
    if (chunksCount > 1) {
        const testsString = JSON.stringify(tests);
        const chunkSize = Math.ceil(testsString.length / chunksCount);
        chunks = Array.from({ length: chunksCount })
            .map((_, chunkIndex) => testsString.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize))
            .map((testsPart, seq) => buildPathname('tests', { runId: uuid, seq, tests: testsPart }));
    }
    else {
        chunks = [fullPathname];
    }
    await Promise.all([
        sendRequest({
            host: 'metrika.kontur.ru',
            path: buildPathname('config', configMeta),
            protocol: 'https:',
        }),
        sendRequest({
            host: 'metrika.kontur.ru',
            path: buildPathname('browsers', browsersMeta),
            protocol: 'https:',
        }),
        ...chunks.map((chunk) => sendRequest({
            host: 'metrika.kontur.ru',
            path: chunk,
            protocol: 'https:',
        })),
    ]);
}
//# sourceMappingURL=telemetry.js.map