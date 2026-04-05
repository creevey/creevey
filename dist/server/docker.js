"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDockerSocket = findDockerSocket;
exports.pullImages = pullImages;
exports.buildImage = buildImage;
exports.runImage = runImage;
const tar_stream_1 = __importDefault(require("tar-stream"));
const loglevel_1 = __importDefault(require("loglevel"));
const stream_1 = require("stream");
const dockerode_1 = __importDefault(require("dockerode"));
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const logger_js_1 = require("./logger.js");
const context_js_1 = require("./worker/context.js");
function findDockerSocket() {
    // List of possible docker.sock locations in order of preference
    const possiblePaths = [
        // Standard Linux location
        '/var/run/docker.sock',
        // Docker Desktop for Mac
        (0, path_1.join)((0, os_1.homedir)(), '.docker', 'run', 'docker.sock'),
        // Colima
        (0, path_1.join)((0, os_1.homedir)(), '.colima', 'default', 'docker.sock'),
        (0, path_1.join)((0, os_1.homedir)(), '.colima', 'docker.sock'),
        // Podman
        '/run/podman/podman.sock',
        ...(process.env.XDG_RUNTIME_DIR ? [(0, path_1.join)(process.env.XDG_RUNTIME_DIR, 'podman', 'podman.sock')] : []),
        // Rancher Desktop
        (0, path_1.join)((0, os_1.homedir)(), '.rd', 'docker.sock'),
        // Orbstack
        (0, path_1.join)((0, os_1.homedir)(), '.orbstack', 'run', 'docker.sock'),
    ];
    for (const socketPath of possiblePaths) {
        if ((0, fs_1.existsSync)(socketPath)) {
            (0, logger_js_1.logger)().debug(`Found Docker socket at: ${socketPath}`);
            return socketPath;
        }
    }
}
let docker = null;
function getDocker() {
    if (!docker) {
        const dockerSocketPath = findDockerSocket();
        docker = new dockerode_1.default(dockerSocketPath ? { socketPath: dockerSocketPath } : undefined);
    }
    return docker;
}
class DevNull extends stream_1.Writable {
    _write(_chunk, _encoding, callback) {
        setImmediate(callback);
    }
}
async function pullImages(images, { auth, platform } = {}) {
    const args = {};
    if (auth)
        args.authconfig = auth;
    if (platform)
        args.platform = platform;
    const docker = getDocker();
    (0, logger_js_1.logger)().info('Pull docker images');
    // TODO Replace with `import from`
    const { default: yoctoSpinner } = await import('yocto-spinner');
    for (const image of images) {
        await new Promise((resolve, reject) => {
            const spinner = yoctoSpinner({ text: `${image}: Pull start` }).start();
            docker.pull(image, args, (pullError, stream) => {
                if (pullError || !stream) {
                    spinner.error(pullError?.message);
                    reject(pullError ?? new Error('Unknown error'));
                    return;
                }
                docker.modem.followProgress(stream, onFinished, onProgress);
                function onFinished(error) {
                    if (error) {
                        spinner.error(error.message);
                        reject(error);
                        return;
                    }
                    spinner.success(`${image}: Pull complete`);
                    resolve();
                }
                function onProgress(event) {
                    if (!/^[a-z0-9]{12}$/i.test(event.id))
                        return;
                    spinner.text = `${image}: [${event.id}] ${event.status} ${event.progress ?? ''}`;
                }
            });
        });
    }
}
async function buildImage(imageName, version, dockerfile) {
    const docker = getDocker();
    const images = await docker.listImages({ filters: { label: [`creevey=${imageName}`] } });
    const containers = await docker.listContainers({ all: true, filters: { label: [`creevey=${imageName}`] } });
    if (containers.length > 0) {
        await Promise.all(containers.map(async (info) => {
            const container = docker.getContainer(info.Id);
            try {
                await container.remove({ force: true });
            }
            catch {
                /* noop */
            }
        }));
    }
    const oldImages = images.filter((info) => info.Labels.version !== version);
    if (oldImages.length > 0) {
        await Promise.all(oldImages.map(async (info) => {
            const image = docker.getImage(info.Id);
            try {
                await image.remove({ force: true });
            }
            catch {
                /* noop */
            }
        }));
    }
    if (oldImages.length !== images.length) {
        (0, logger_js_1.logger)().info(`Image ${imageName} already exists`);
        return;
    }
    const pack = tar_stream_1.default.pack();
    pack.entry({ name: 'Dockerfile' }, dockerfile);
    pack.finalize();
    const { default: yoctoSpinner } = await import('yocto-spinner');
    const spinner = yoctoSpinner({ text: `${imageName}: Build start` });
    if ((0, logger_js_1.logger)().getLevel() > loglevel_1.default.levels.DEBUG) {
        spinner.start();
    }
    let isFailed = false;
    await new Promise((resolve, reject) => {
        docker.buildImage(pack, 
        // TODO Support buildkit decode grpc (version: '2')
        { t: imageName, labels: { creevey: imageName, version }, version: '1' }, (buildError, stream) => {
            if (buildError || !stream) {
                // spinner.error(buildError?.message);
                reject(buildError ?? new Error('Unknown error'));
                return;
            }
            docker.modem.followProgress(stream, onFinished, onProgress);
            function onFinished(error) {
                if (isFailed)
                    return;
                if (error) {
                    spinner.error(error.message);
                    reject(error);
                    return;
                }
                spinner.success(`${imageName}: Build complete`);
                resolve();
            }
            function onProgress(event) {
                if ('stream' in event) {
                    if ((0, logger_js_1.logger)().getLevel() <= loglevel_1.default.levels.DEBUG) {
                        (0, logger_js_1.logger)().debug(event.stream.trim());
                    }
                    else {
                        spinner.text = `${imageName}: [Build] - ${event.stream}`;
                    }
                }
                else if ('errorDetail' in event) {
                    isFailed = true;
                    spinner.error(event.error);
                    reject(new Error(event.error));
                }
            }
        });
    });
}
async function runImage(image, args, options, debug) {
    const docker = getDocker();
    const hub = docker.run(image, args, debug ? process.stdout : new DevNull(), options, (error) => {
        if (error)
            throw error;
    });
    return new Promise((resolve) => {
        hub.once('container', (container) => {
            (0, context_js_1.setWorkerContainer)(container);
        });
        hub.once('start', (container) => void container.inspect().then((info) => {
            if ('podman' in info.NetworkSettings.Networks) {
                // NOTE: Podman uses different default network
                resolve(info.NetworkSettings.Networks.podman.IPAddress);
            }
            else {
                resolve(info.NetworkSettings.Networks.bridge.IPAddress);
            }
        }));
    });
}
//# sourceMappingURL=docker.js.map