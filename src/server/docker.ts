import tar from 'tar-stream';
import Logger from 'loglevel';
import { Writable } from 'stream';
import Dockerode, { Container } from 'dockerode';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { DockerAuth } from '../types.js';
import { logger } from './logger.js';
import { setWorkerContainer } from './worker/context.js';

function findDockerSocket(): string | undefined {
  // List of possible docker.sock locations in order of preference
  const possiblePaths = [
    // Standard Linux location
    '/var/run/docker.sock',
    // Docker Desktop for Mac
    join(homedir(), '.docker', 'run', 'docker.sock'),
    // Colima
    join(homedir(), '.colima', 'default', 'docker.sock'),
    join(homedir(), '.colima', 'docker.sock'),
    // Podman
    '/run/podman/podman.sock',
    ...(process.env.XDG_RUNTIME_DIR ? [join(process.env.XDG_RUNTIME_DIR, 'podman', 'podman.sock')] : []),
    // Rancher Desktop
    join(homedir(), '.rd', 'docker.sock'),
    // Orbstack
    join(homedir(), '.orbstack', 'run', 'docker.sock'),
  ];

  for (const socketPath of possiblePaths) {
    if (existsSync(socketPath)) {
      logger().debug(`Found Docker socket at: ${socketPath}`);
      return socketPath;
    }
  }

  // Fall back to default if no socket found
  logger().warn('No Docker socket found at known locations, using default');
}

const dockerSocketPath = findDockerSocket();
const docker = new Dockerode(dockerSocketPath ? { socketPath: dockerSocketPath } : undefined);

export function getDockerSocketPath(): string | undefined {
  return dockerSocketPath ?? '/var/run/docker.sock';
}

class DevNull extends Writable {
  _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    setImmediate(callback);
  }
}

export async function pullImages(
  images: string[],
  { auth, platform }: { auth?: DockerAuth; platform?: string } = {},
): Promise<void> {
  const args: Record<string, unknown> = {};
  if (auth) args.authconfig = auth;
  if (platform) args.platform = platform;

  logger().info('Pull docker images');
  // TODO Replace with `import from`
  const { default: yoctoSpinner } = await import('yocto-spinner');
  for (const image of images) {
    await new Promise<void>((resolve, reject) => {
      const spinner = yoctoSpinner({ text: `${image}: Pull start` }).start();

      docker.pull(image, args, (pullError: Error | null, stream?: NodeJS.ReadableStream) => {
        if (pullError || !stream) {
          spinner.error(pullError?.message);
          reject(pullError ?? new Error('Unknown error'));
          return;
        }

        docker.modem.followProgress(stream, onFinished, onProgress);

        function onFinished(error: Error | null): void {
          if (error) {
            spinner.error(error.message);
            reject(error);
            return;
          }
          spinner.success(`${image}: Pull complete`);
          resolve();
        }

        function onProgress(event: { id: string; status: string; progress?: string }): void {
          if (!/^[a-z0-9]{12}$/i.test(event.id)) return;

          spinner.text = `${image}: [${event.id}] ${event.status} ${event.progress ?? ''}`;
        }
      });
    });
  }
}

export async function buildImage(imageName: string, version: string, dockerfile: string): Promise<void> {
  const images = await docker.listImages({ filters: { label: [`creevey=${imageName}`] } });

  const containers = await docker.listContainers({ all: true, filters: { label: [`creevey=${imageName}`] } });
  if (containers.length > 0) {
    await Promise.all(
      containers.map(async (info) => {
        const container = docker.getContainer(info.Id);
        try {
          await container.remove({ force: true });
        } catch {
          /* noop */
        }
      }),
    );
  }

  const oldImages = images.filter((info) => info.Labels.version !== version);
  if (oldImages.length > 0) {
    await Promise.all(
      oldImages.map(async (info) => {
        const image = docker.getImage(info.Id);
        try {
          await image.remove({ force: true });
        } catch {
          /* noop */
        }
      }),
    );
  }

  if (oldImages.length !== images.length) {
    logger().info(`Image ${imageName} already exists`);
    return;
  }

  const pack = tar.pack();
  pack.entry({ name: 'Dockerfile' }, dockerfile);
  pack.finalize();

  const { default: yoctoSpinner } = await import('yocto-spinner');
  const spinner = yoctoSpinner({ text: `${imageName}: Build start` });
  if (logger().getLevel() > Logger.levels.DEBUG) {
    spinner.start();
  }
  let isFailed = false;
  await new Promise<void>((resolve, reject) => {
    docker.buildImage(
      pack,
      // TODO Support buildkit decode grpc (version: '2')
      { t: imageName, labels: { creevey: imageName, version }, version: '1' },
      (buildError: Error | null, stream) => {
        if (buildError || !stream) {
          // spinner.error(buildError?.message);
          reject(buildError ?? new Error('Unknown error'));
          return;
        }

        docker.modem.followProgress(stream, onFinished, onProgress);

        function onFinished(error: Error | null): void {
          if (isFailed) return;

          if (error) {
            spinner.error(error.message);
            reject(error);
            return;
          }
          spinner.success(`${imageName}: Build complete`);
          resolve();
        }

        function onProgress(
          event:
            | { stream: string }
            | { errorDetail: { code: number; message: string }; error: string }
            | { id: string; aux: string }, // NOTE: Only with `version: '2'`
        ): void {
          if ('stream' in event) {
            if (logger().getLevel() <= Logger.levels.DEBUG) {
              logger().debug(event.stream.trim());
            } else {
              spinner.text = `${imageName}: [Build] - ${event.stream}`;
            }
          } else if ('errorDetail' in event) {
            isFailed = true;
            spinner.error(event.error);
            reject(new Error(event.error));
          }
        }
      },
    );
  });
}

export async function runImage(
  image: string,
  args: string[],
  options: Record<string, unknown>,
  debug: boolean,
): Promise<string> {
  const hub = docker.run(image, args, debug ? process.stdout : new DevNull(), options, (error) => {
    if (error) throw error;
  });

  return new Promise((resolve) => {
    hub.once('container', (container: Container) => {
      setWorkerContainer(container);
    });
    hub.once(
      'start',
      (container: Container) =>
        void container.inspect().then((info) => {
          if ('podman' in info.NetworkSettings.Networks) {
            // NOTE: Podman uses different default network
            resolve(info.NetworkSettings.Networks.podman.IPAddress);
          } else {
            resolve(info.NetworkSettings.Networks.bridge.IPAddress);
          }
        }),
    );
  });
}
