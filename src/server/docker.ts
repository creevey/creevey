import path from 'path';
import cluster, { isMaster } from 'cluster';
import Docker, { Container } from 'dockerode';
import { Config, BrowserConfig, isDockerMessage, noop } from '../types';
import { defaultBrowser } from './config';
import { subscribeOn, emitDockerMessage, sendDockerMessage } from './messages';
import { Writable } from 'stream';
import { mkdir, writeFile } from 'fs';
import { promisify } from 'util';
import findCacheDir from 'find-cache-dir';

const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);

const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/gi;

const docker = new Docker();

class DevNull extends Writable {
  _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    setImmediate(callback);
  }
}

async function startSelenoidContainer(config: Config): Promise<string> {
  const limit = Object.values(config.browsers)
    .map((c) => (c as BrowserConfig).limit ?? 1)
    .reduce((a, b) => a + b, 0);

  const m = Object.values(config.browsers)
    .map((c) => c as BrowserConfig)
    .map((c) => ({
      browserName: c.browserName,
      version: c.version ?? 'latest',
      config: {
        image: `selenoid/${c.browserName}:${c.version ?? 'latest'}`,
        port: '4444',
        path: c.browserName == 'chrome' || c.browserName == 'opera' ? '/' : '/wd/hub',
      },
    }));

  const selenoidConfig: {
    [browser: string]: {
      default: string;
      versions: { [version: string]: { image: string; port: string; path: string } };
    };
  } = {};
  m.forEach(({ browserName, version, config }) => {
    if (!selenoidConfig[browserName]) selenoidConfig[browserName] = { default: version, versions: {} };
    selenoidConfig[browserName].versions[version] = config;
  });

  const selenoidConfigDir = path.join(findCacheDir({ name: 'creevey' }) as string, 'selenoid');
  await mkdirAsync(selenoidConfigDir, { recursive: true });
  await writeFileAsync(path.join(selenoidConfigDir, 'browsers.json'), JSON.stringify(selenoidConfig));

  const image = 'aerokube/selenoid:latest-release';
  await docker.pull(image);
  const hub = docker.run(
    image,
    ['-limit', String(limit)],
    process.stdout,
    {
      name: 'selenoid',
      ExposedPorts: { '4444/tcp': {} },
      HostConfig: {
        PortBindings: { '4444/tcp': [{ HostPort: '4444' }] },
        Binds: ['/var/run/docker.sock:/var/run/docker.sock', `${selenoidConfigDir}:/etc/selenoid/:ro`],
      },
    },
    noop,
  );

  // TODO containers not removing :(
  return new Promise((resolve) => {
    hub.once('container', (container: Container) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      subscribeOn('shutdown', async () => {
        await container.stop();
        await container.remove();
      });
    });
    // TODO subscribe on error
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    hub.once('start', async (container: Container) =>
      resolve((await container.inspect()).NetworkSettings.Networks.bridge.Gateway),
    );
  });
}

export default async function (config: Config, browser = defaultBrowser): Promise<Config> {
  if (isMaster) {
    const gridHost = await startSelenoidContainer(config);
    const gridUrl = `http://${gridHost}:4444/wd/hub`;

    cluster.on('message', (worker, message: unknown) => {
      if (!isDockerMessage(message)) return;

      const dockerMessage = message;
      if (dockerMessage.type != 'start') return;

      const browserConfig = config.browsers[dockerMessage.payload.browser] as BrowserConfig;
      let storybookUrl = browserConfig.storybookUrl ?? config.storybookUrl;
      if (LOCALHOST_REGEXP.test(storybookUrl)) {
        storybookUrl = storybookUrl.replace(LOCALHOST_REGEXP, gridHost);
      }

      sendDockerMessage(worker, {
        type: 'success',
        payload: { gridUrl, storybookUrl },
      });
    });
    return Promise.resolve(config);
  } else {
    return new Promise((resolve, reject) => {
      subscribeOn('docker', (message) => {
        if (message.type == 'success') {
          config.gridUrl = message.payload.gridUrl;
          config.storybookUrl = message.payload.storybookUrl;
          resolve(config);
        }
        if (message.type == 'fail') {
          reject(message.payload.error);
        }
      });
      emitDockerMessage({ type: 'start', payload: { browser, pid: process.pid } });
    });
  }
}
