import tar from 'tar-stream';
import { Writable } from 'stream';
import Dockerode, { Container } from 'dockerode';
import { DockerAuth } from '../types.js';
import { subscribeOn } from './messages.js';
import { logger } from './logger.js';

const docker = new Dockerode();

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

  logger.info('Pull docker images');
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

          spinner.text = `${image}: [${event.id}] ${event.status} ${event.progress ? event.progress : ''}`;
        }
      });
    });
  }
}

export async function buildImage(imageName: string, dockerfile: string): Promise<void> {
  const images = await docker.listImages({ filters: { label: [`creevey=${imageName}`] } });

  if (images.at(0)) {
    logger.info(`Image ${imageName} already exists`);
    return;
  }

  const pack = tar.pack();
  pack.entry({ name: 'Dockerfile' }, dockerfile);
  pack.finalize();

  const { default: yoctoSpinner } = await import('yocto-spinner');
  const spinner = yoctoSpinner({ text: `${imageName}: Build start` }).start();
  await new Promise<void>((resolve, reject) => {
    void docker.buildImage(
      // @ts-expect-error Type incompatibility AsyncIterator and AsyncIterableIterator
      pack,
      { t: imageName, labels: { creevey: imageName } },
      (buildError: Error | null, stream) => {
        if (buildError || !stream) {
          spinner.error(buildError?.message);
          reject(buildError ?? new Error('Unknown error'));
          return;
        }

        docker.modem.followProgress(stream, onFinished, onProgress);

        function onFinished(error: Error | null): void {
          if (error) {
            spinner.error(error.message);
            reject(error);
            return;
          }
          spinner.success(`${imageName}: Build complete`);
          resolve();
        }

        function onProgress(event: { id: string; status: string; progress?: string }): void {
          if (!/^[a-z0-9]{12}$/i.test(event.id)) return;

          spinner.text = `${imageName}: [${event.id}] ${event.status} ${event.progress ? event.progress : ''}`;
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
  await Promise.all(
    (await docker.listContainers({ all: true, filters: { ancestor: [image] } })).map(async (info) => {
      const container = docker.getContainer(info.Id);
      try {
        await container.stop();
      } catch {
        /* noop */
      }
      await container.remove();
    }),
  );

  const hub = docker.run(image, args, debug ? process.stdout : new DevNull(), options, (error) => {
    if (error) throw error;
  });

  return new Promise((resolve) => {
    hub.once('container', (container: Container) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      subscribeOn('shutdown', async () => {
        try {
          await container.stop();
          await container.remove();
        } catch {
          /* noop */
        }
      });
    });
    hub.once(
      'start',
      (container: Container) =>
        void container.inspect().then((info) => {
          resolve(info.NetworkSettings.Networks.bridge.IPAddress);
        }),
    );
  });
}
