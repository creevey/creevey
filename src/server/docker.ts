import path from 'path';
import { promisify } from 'util';
import { Writable } from 'stream';
import { mkdir, writeFile } from 'fs';
import { isMaster } from 'cluster';
import Docker, { Container } from 'dockerode';
import ora from 'ora';
import { Config, BrowserConfig, Options } from '../types';
import { subscribeOn } from './messages';
import { getCreeveyCache } from './utils';

const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);

const docker = new Docker();

class DevNull extends Writable {
  _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    setImmediate(callback);
  }
}

async function startSelenoidContainer(config: Config, debug: boolean): Promise<void> {
  const selenoidImage = 'aerokube/selenoid:latest-release';
  const selenoidConfig: {
    [browser: string]: {
      default: string;
      versions: { [version: string]: { image: string; port: string; path: string } };
    };
  } = {};

  let limit = 0;
  const images = [selenoidImage];

  (Object.values(config.browsers) as BrowserConfig[]).forEach(
    ({
      browserName,
      version = 'latest',
      limit: browserLimit = 1,
      dockerImage = `selenoid/${browserName}:${version}`,
    }) => {
      limit += browserLimit;
      images.push(dockerImage);

      if (!selenoidConfig[browserName]) selenoidConfig[browserName] = { default: version, versions: {} };
      selenoidConfig[browserName].versions[version] = {
        image: dockerImage,
        port: '4444',
        path: browserName == 'chrome' || browserName == 'opera' ? '/' : '/wd/hub',
      };
    },
  );

  const selenoidConfigDir = path.join(getCreeveyCache(), 'selenoid');
  await mkdirAsync(selenoidConfigDir, { recursive: true });
  await writeFileAsync(path.join(selenoidConfigDir, 'browsers.json'), JSON.stringify(selenoidConfig));

  await pullImages(images);

  const hub = docker.run(
    selenoidImage,
    ['-limit', String(limit)],
    debug ? process.stdout : new DevNull(),
    {
      name: 'selenoid',
      ExposedPorts: { '4444/tcp': {} },
      HostConfig: {
        PortBindings: { '4444/tcp': [{ HostPort: '4444' }] },
        Binds: ['/var/run/docker.sock:/var/run/docker.sock', `${selenoidConfigDir}:/etc/selenoid/:ro`],
      },
    },
    (error) => {
      if (error) throw error;
    },
  );

  return new Promise((resolve) => {
    hub.once('container', (container: Container) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      subscribeOn('shutdown', async () => {
        await container.stop();
        await container.remove();
      });
    });
    hub.once('start', resolve);
  });
}

async function pullImages(images: string[]): Promise<void> {
  console.log('[CreeveyMaster]: Pull docker images');
  for (const image of images) {
    await new Promise<void>((resolve, reject) => {
      const spinner = ora(`${image}: Pull start`).start();

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      docker.pull(image, function (pullError: unknown, stream: ReadableStream) {
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

export default async function (config: Config, { debug }: Options): Promise<Config> {
  if (isMaster) {
    await startSelenoidContainer(config, debug);
  } else {
    config.gridUrl = 'http://localhost:4444/wd/hub';
  }
  return config;
}
