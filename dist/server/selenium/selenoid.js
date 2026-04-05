"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSelenoidStandalone = startSelenoidStandalone;
exports.startSelenoidContainer = startSelenoidContainer;
const path_1 = __importDefault(require("path"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const shelljs_1 = require("shelljs");
const utils_js_1 = require("../utils.js");
const docker_js_1 = require("../docker.js");
const messages_js_1 = require("../messages.js");
const context_js_1 = require("../worker/context.js");
async function createSelenoidConfig(browsers, { useDocker }) {
    const selenoidConfig = {};
    const cacheDir = await (0, utils_js_1.getCreeveyCache)();
    (0, assert_1.default)(cacheDir, "Couldn't get cache directory");
    const selenoidConfigDir = path_1.default.join(cacheDir, 'selenoid');
    browsers.forEach(({ browserName, seleniumCapabilities: { browserVersion = 'latest' } = {}, dockerImage = `selenoid/${browserName}:${browserVersion}`, webdriverCommand = [], }) => {
        selenoidConfig[browserName] ??= { default: browserVersion, versions: {} };
        if (!useDocker && webdriverCommand.length == 0)
            throw new Error('Please specify "webdriverCommand" browser option with path to browser webdriver');
        selenoidConfig[browserName].versions[browserVersion] = {
            image: useDocker ? dockerImage : webdriverCommand,
            port: '4444',
            path: !useDocker || ['chrome', 'opera', 'webkit', 'MicrosoftEdge'].includes(browserName) ? '/' : '/wd/hub',
        };
    });
    await (0, promises_1.mkdir)(selenoidConfigDir, { recursive: true });
    await (0, promises_1.writeFile)(path_1.default.join(selenoidConfigDir, 'browsers.json'), JSON.stringify(selenoidConfig));
    return selenoidConfigDir;
}
async function downloadSelenoidBinary(destination) {
    const platformNameMapping = {
        darwin: 'selenoid_darwin_amd64',
        linux: 'selenoid_linux_amd64',
        win32: 'selenoid_windows_amd64.exe',
    };
    // TODO Replace with `import from`
    const { Octokit } = await import('@octokit/core');
    const octokit = new Octokit();
    const response = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
        owner: 'aerokube',
        repo: 'selenoid',
    });
    const { assets } = response.data;
    const { browser_download_url: downloadUrl, size: binarySize } = assets.find(({ name }) => platformNameMapping[process.platform] == name) ?? {};
    if ((0, fs_1.existsSync)(destination) && (0, fs_1.lstatSync)(destination).size == binarySize)
        return;
    if (!downloadUrl) {
        throw new Error(`Couldn't get download url for selenoid binary. Please download it manually from "https://github.com/aerokube/selenoid/releases/latest" and define "selenoidPath" option in the Creevey config`);
    }
    return (0, utils_js_1.downloadBinary)(downloadUrl, destination);
}
async function startSelenoidStandalone(config, debug) {
    const browsers = Object.values(config.browsers).filter((browser) => !browser.gridUrl);
    const selenoidConfigDir = await createSelenoidConfig(browsers, { useDocker: false });
    const binaryPath = path_1.default.join(selenoidConfigDir, process.platform == 'win32' ? 'selenoid.exe' : 'selenoid');
    if (config.selenoidPath) {
        await (0, promises_1.copyFile)(path_1.default.resolve(config.selenoidPath), binaryPath);
    }
    else {
        await downloadSelenoidBinary(binaryPath);
    }
    // TODO Download browser webdrivers
    try {
        if (process.platform != 'win32')
            (0, shelljs_1.chmod)('+x', binaryPath);
    }
    catch {
        /* noop */
    }
    const selenoidProcess = (0, shelljs_1.exec)(`${binaryPath} -conf ./browsers.json -disable-docker`, {
        async: true,
        cwd: selenoidConfigDir,
    });
    if (debug) {
        selenoidProcess.stdout?.pipe(process.stdout);
        selenoidProcess.stderr?.pipe(process.stderr);
    }
    (0, messages_js_1.subscribeOn)('shutdown', () => {
        if (selenoidProcess.pid)
            void (0, utils_js_1.killTree)(selenoidProcess.pid);
    });
}
async function startSelenoidContainer(config, debug) {
    const browsers = Object.values(config.browsers).filter((browser) => !browser.gridUrl);
    const images = [];
    let limit = 0;
    browsers.forEach(({ browserName, seleniumCapabilities: { browserVersion = 'latest' } = {}, limit: browserLimit = 1, dockerImage = `selenoid/${browserName}:${browserVersion}`, }) => {
        limit += browserLimit;
        images.push(dockerImage);
    });
    const selenoidImage = config.dockerImage;
    const pullOptions = { auth: config.dockerAuth, platform: config.dockerImagePlatform };
    if (config.pullImages) {
        await (0, docker_js_1.pullImages)([selenoidImage], pullOptions);
        await (0, docker_js_1.pullImages)(images, pullOptions);
    }
    // TODO Allow pass custom options
    const dockerSocketPath = (0, docker_js_1.findDockerSocket)() ?? '/var/run/docker.sock';
    const selenoidOptions = {
        ExposedPorts: { '4444/tcp': {} },
        HostConfig: {
            PortBindings: { '4444/tcp': [{ HostPort: '4444' }] },
            Binds: [
                `${dockerSocketPath}:/var/run/docker.sock`,
                `${await createSelenoidConfig(browsers, { useDocker: true })}:/etc/selenoid/:ro`,
            ],
        },
    };
    (0, messages_js_1.subscribeOn)('shutdown', () => {
        void (0, context_js_1.removeWorkerContainer)();
    });
    return (0, docker_js_1.runImage)(selenoidImage, ['-limit', String(limit)], selenoidOptions, debug);
}
//# sourceMappingURL=selenoid.js.map