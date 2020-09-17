import cluster, { isMaster } from 'cluster';
import getPort from 'get-port';
import Docker, { Container } from 'dockerode';
import { Config, BrowserConfig, isDockerMessage, noop } from '../types';
import { defaultBrowser } from './config';
import { subscribeOn, emitDockerMessage, sendDockerMessage } from './messages';
import { Writable } from 'stream';

const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/gi;

const docker = new Docker();

class DevNull extends Writable {
  _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    setImmediate(callback);
  }
}

async function startBrowserContainer(config: BrowserConfig): Promise<{ id: string; host: string; port: number }> {
  // TODO Output spinner
  const image = `selenoid/${config.browserName}:${config.version ?? 'latest'}`;
  const port = await getPort();

  await docker.pull(image);
  const hub = docker.run(
    image,
    [],
    new DevNull(),
    {
      name: `${config.browserName}-${port}`,
      ExposedPorts: { '4444/tcp': {} },
      HostConfig: { PortBindings: { '4444/tcp': [{ HostPort: String(port) }] } },
    },
    noop,
  );

  return new Promise((resolve) => {
    hub.on('container', (container: Container) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      subscribeOn('shutdown', async () => {
        await container.stop();
        await container.remove();
      });
    });
    // TODO subscribe on error
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    hub.once('start', async (container: Container) => {
      const host = (await container.inspect()).NetworkSettings.Networks.bridge.Gateway;
      resolve({ id: container.id, host, port });
    });
  });
}

export default function (config: Config, browser = defaultBrowser): Promise<Config> {
  if (isMaster) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    cluster.on('message', async (worker, message: unknown) => {
      if (!isDockerMessage(message)) return;

      const dockerMessage = message;
      if (dockerMessage.type != 'start') return;

      const browserConfig = config.browsers[dockerMessage.payload.browser] as BrowserConfig;

      // TODO Handle error
      const { id, host, port } = await startBrowserContainer(browserConfig);

      const gridUrl = `http://${host}:${port}/wd/hub`;
      let storybookUrl = browserConfig.storybookUrl ?? config.storybookUrl;

      if (LOCALHOST_REGEXP.test(storybookUrl)) {
        storybookUrl = storybookUrl.replace(LOCALHOST_REGEXP, host);
      }

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      worker.on('exit', async () => {
        const container = docker.getContainer(id);
        await container.stop();
        await container.remove();
      });

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
