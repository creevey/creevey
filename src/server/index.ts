import cluster from 'cluster';
import path from 'path';
import sh from 'shelljs';
import { getUserAgent } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
import { readConfig, defaultBrowser } from './config.js';
import { Options, Config, BrowserConfigObject, isWorkerMessage } from '../types.js';
import { logger } from './logger.js';
import { getStorybookUrl, checkIsStorybookConnected } from './connection.js';
import { SeleniumWebdriver } from './selenium/webdriver.js';
import { LOCALHOST_REGEXP } from './webdriver.js';
import { isInsideDocker, killTree, resolvePlaywrightBrowserType, shutdownWithError } from './utils.js';
import { sendWorkerMessage, subscribeOn } from './messages.js';
import { buildImage } from './docker.js';
import { mkdir, writeFile } from 'fs/promises';
import assert from 'assert';

async function startWebdriverServer(browser: string, config: Config, options: Options): Promise<string | undefined> {
  if (config.webdriver === SeleniumWebdriver) {
    if (cluster.isPrimary) {
      const { startSelenoidContainer, startSelenoidStandalone } = await import('./selenium/selenoid.js');
      const gridUrl = 'http://localhost:4444/wd/hub';
      if (config.useDocker) {
        const host = await startSelenoidContainer(config, options.debug);
        return isInsideDocker ? gridUrl.replace(LOCALHOST_REGEXP, host) : gridUrl;
      }
      await startSelenoidStandalone(config, options.debug);
      return gridUrl;
    }
    // TODO Worker might want to use docker image of browser or start standalone selenium
  } else {
    if (config.gridUrl) return undefined;

    if (!config.useDocker) {
      if (cluster.isPrimary) return undefined;

      const { browserName } = config.browsers[browser] as BrowserConfigObject;
      return `creevey://${resolvePlaywrightBrowserType(browserName)}`;
    }

    const {
      default: { version },
    } = await import('playwright-core/package.json', { with: { type: 'json' } });

    if (cluster.isWorker) {
      // TODO Re-use dockerImage
      const { startPlaywrightContainer } = await import('./playwright/docker.js');
      const { browserName } = config.browsers[browser] as BrowserConfigObject;

      const imageName = `creevey/${browserName}:v${version}`;
      const host = await startPlaywrightContainer(imageName, browser, config, options.debug);

      return host;
    } else {
      const { playwrightDockerFile } = await import('./playwright/docker-file.js');
      const {
        default: { version: creeveyVersion },
      } = await import('../../package.json', { with: { type: 'json' } });
      const browsers = [...new Set(Object.values(config.browsers).map((c) => (c as BrowserConfigObject).browserName))];
      await Promise.all(
        browsers.map(async (browserName) => {
          const imageName = `creevey/${browserName}:v${version}`;
          const dockerfile = await playwrightDockerFile(browserName, version);

          await buildImage(imageName, creeveyVersion, dockerfile);
        }),
      );

      const { default: getPort } = await import('get-port');

      cluster.on('message', (worker, message: unknown) => {
        if (!isWorkerMessage(message)) return;

        const workerMessage = message;
        if (workerMessage.type != 'port') return;

        void getPort().then((port) => {
          sendWorkerMessage(worker, {
            type: 'port',
            payload: { port },
          });
        });
      });
    }
    // TODO Support gridUrl for playwright
    // NOTE: There is no grid for playwright right now
  }
}

// TODO Why docker containers are not deleting after stop?
export default async function (options: Options): Promise<void> {
  const config = await readConfig(options);
  const { browser = defaultBrowser, update, ui, port } = options;
  let gridUrl = cluster.isPrimary ? config.gridUrl : options.gridUrl;

  // TODO Add package.json with `"type": "commonjs"` as workaround for esm packages to load `data.js`
  await mkdir(config.reportDir, { recursive: true });
  await writeFile(path.join(config.reportDir, 'package.json'), '{"type": "commonjs"}');

  // NOTE: We don't need docker nor selenoid for update option
  if (
    !(gridUrl || (Object.values(config.browsers) as BrowserConfigObject[]).every(({ gridUrl }) => gridUrl)) &&
    !update
  ) {
    gridUrl = await startWebdriverServer(browser, config, options);
  }

  if (cluster.isPrimary && !update) {
    const [localUrl, remoteUrl] = getStorybookUrl(config, options);

    if (options.storybookStart) {
      const pm = getUserAgent();
      assert(pm, new Error('Failed to detect current package manager'));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { command, args } = resolveCommand(pm, 'run', ['storybook', 'dev'])!;
      const storybookPort = new URL(localUrl).port;
      const storybookCommand = `${config.storybookAutorunCmd ?? [command, ...args, '--ci'].join(' ')} -p ${storybookPort}`;

      logger().info(`Start Storybook via \`${storybookCommand}\`, it should be accessible at:`);
      logger().info(`Local - ${localUrl}`);
      if (remoteUrl && localUrl != remoteUrl) logger().info(`On your network - ${remoteUrl}`);
      logger().info('Waiting Storybook...');

      const storybook = sh.exec(storybookCommand, { async: true });
      subscribeOn('shutdown', () => {
        if (storybook.pid) void killTree(storybook.pid);
      });
    } else {
      logger().info('Storybook should be started and be accessible at:');
      logger().info(`Local - ${localUrl}`);
      if (remoteUrl && localUrl != remoteUrl) logger().info(`On your network - ${remoteUrl}`);
      logger().info(
        'Tip: Creevey can start Storybook automatically by using `-s` option at the command line. (e.g., yarn/npm run creevey -s)',
      );
      logger().info('Waiting Storybook...');
    }

    if (options.storybookStart || process.env.CI !== 'true') {
      const isConnected = await checkIsStorybookConnected(localUrl);
      if (isConnected) {
        logger().info('Storybook connected!\n');
      } else {
        logger().error('Storybook is not responding. Please start Storybook and restart Creevey');
        shutdownWithError();
      }
    }
  }

  await import('./shutdown.js');

  switch (true) {
    case Boolean(update) && Boolean(ui): {
      // New UI Update mode
      const { uiUpdate } = await import('./ui-update.js');
      await uiUpdate(config, port);
      return;
    }
    case Boolean(update): {
      (await import('./update.js')).update(config, typeof update == 'string' ? update : undefined);
      return;
    }
    case cluster.isPrimary: {
      if (config.webdriver === SeleniumWebdriver) {
        try {
          await import('selenium-webdriver');
        } catch {
          logger().error('Failed to start Creevey, missing required dependency: "selenium-webdriver"');
          process.exit(-1);
        }
      } else {
        try {
          await import('playwright-core');
        } catch {
          logger().error('Failed to start Creevey, missing required dependency: "playwright-core"');
          process.exit(-1);
        }
      }
      logger().info('Starting Master Process');

      return (await import('./master/start.js')).start(gridUrl, config, options);
    }
    default: {
      logger().info(`Starting Worker for ${browser}`);

      // NOTE: We assume that we pass `gridUrl` to worker CLI options
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return (await import('./worker/start.js')).start(browser, gridUrl!, config, options);
    }
  }
}
