import assert from 'assert';
import { mkdir } from 'fs/promises';
import { runImage } from '../docker';
import { emitWorkerMessage, subscribeOn } from '../messages';
import { getCreeveyCache, isInsideDocker, resolvePlaywrightBrowserType } from '../utils';
import { LOCALHOST_REGEXP } from '../webdriver';
import type { BrowserConfigObject, Config } from '../../types';

export async function startPlaywrightContainer(
  imageName: string,
  browser: string,
  config: Config,
  debug: boolean,
): Promise<string> {
  const { browserName, playwrightOptions } = config.browsers[browser] as BrowserConfigObject;
  const port = await new Promise<number>((resolve) => {
    subscribeOn('worker', (message) => {
      if (message.type == 'port') {
        resolve(message.payload.port);
      }
    });
    emitWorkerMessage({ type: 'port', payload: { port: -1 } });
  });

  const cacheDir = await getCreeveyCache();

  assert(cacheDir, "Couldn't get cache directory");

  // NOTE: Docker creates root directory if it doesn't exist, but Podman doesn't create it
  // https://github.com/containers/podman/issues/6234
  await mkdir(`${cacheDir}/${process.pid}`, { recursive: true });

  const host = await runImage(
    imageName,
    [JSON.stringify({ ...playwrightOptions, browser: resolvePlaywrightBrowserType(browserName) })],
    {
      ExposedPorts: { [`${port}/tcp`]: {} },
      HostConfig: {
        PortBindings: { ['4444/tcp']: [{ HostPort: `${port}` }] },
        Binds: [`${cacheDir}/${process.pid}:/creevey/traces`],
        // Mount current working directory with creevey and playwright-core
        // VolumesFrom: [`${process.cwd()}`],
      },
      // TODO Run creevey through package manager which starts pw server from index-source.mjs
      // Entrypoint: ['pkgManager', 'creevey', 'launchPWServer', JSON.stringify(options)],
    },
    debug,
  );

  const gridUrl = `ws://localhost:${port}/creevey`;

  return isInsideDocker ? gridUrl.replace(LOCALHOST_REGEXP, host) : gridUrl;
}
