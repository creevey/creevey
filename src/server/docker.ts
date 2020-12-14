import cluster, { isMaster } from 'cluster';
import { Config, BrowserConfig, isDockerMessage, DockerAuth } from '../types';
import { subscribeOn, sendDockerMessage, emitDockerMessage } from './messages';
import { isInsideDocker, LOCALHOST_REGEXP } from './utils';
import Dockerode, { Container } from 'dockerode';
import { Writable } from 'stream';
import ora from 'ora';

const docker = new Dockerode();

class DevNull extends Writable {
  _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    setImmediate(callback);
  }
}

export async function pullImages(images: string[], auth?: DockerAuth): Promise<void> {
  console.log('[CreeveyMaster]: Pull docker images');
  for (const image of images) {
    await new Promise<void>((resolve, reject) => {
      const spinner = ora(`${image}: Pull start`).start();

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      docker.pull(image, { authconfig: auth }, function (pullError: unknown, stream: ReadableStream) {
        if (pullError) {
          spinner.fail();
          return reject(pullError);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        docker.modem.followProgress(stream, onFinished, onProgress);

        function onFinished(error: unknown): void {
          if (error) {
            spinner.fail();
            return reject(error);
          }
          spinner.succeed(`${image}: Pull complete`);
          resolve();
        }

        function onProgress(event: { id: string; status: string; progress?: string }): void {
          if (!/^[a-z0-9]{12}$/i.test(event.id)) return;

          spinner.text = `${image}: [${event.id}] ${event.status} ${event.progress ? `${event.progress}` : ''}`;
        }
      });
    });
  }
}

export async function runImage(
  image: string,
  args: string[],
  options: Record<string, unknown>,
  debug: boolean,
): Promise<string> {
  await Promise.all(
    (await docker.listContainers({ all: true, filters: { name: ['selenoid'] } })).map(async (info) => {
      const container = docker.getContainer(info.Id);
      try {
        await container.stop();
      } catch (_) {
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
        } catch (error) {
          /* noop */
        }
      });
    });
    hub.once(
      'start',
      (container: Container) =>
        void container.inspect().then((info) => resolve(info.NetworkSettings.Networks.bridge.IPAddress)),
    );
  });
}

export default async function (
  config: Config,
  browser: string | undefined,
  startContainer: () => Promise<string>,
): Promise<Config> {
  if (isMaster) {
    const host = await startContainer();
    let gridUrl = 'http://localhost:4444/wd/hub';
    gridUrl = isInsideDocker ? gridUrl.replace(LOCALHOST_REGEXP, host) : gridUrl;
    cluster.on('message', (worker, message: unknown) => {
      if (!isDockerMessage(message)) return;

      const dockerMessage = message;
      if (dockerMessage.type != 'start') return;

      sendDockerMessage(worker, {
        type: 'success',
        payload: { gridUrl },
      });
    });
    return config;
  } else {
    if (browser && (config.browsers[browser] as BrowserConfig).gridUrl) return Promise.resolve(config);
    return new Promise((resolve) => {
      subscribeOn('docker', (message) => {
        if (message.type == 'success') {
          config.gridUrl = message.payload.gridUrl;
          resolve(config);
        }
      });
      emitDockerMessage({ type: 'start' });
    });
  }
}
