import cluster from 'cluster';
import path from 'path';
import { readConfig, defaultBrowser } from './config.js';
import { Options, Config, BrowserConfigObject, isWorkerMessage } from '../types.js';
import { logger } from './logger.js';
import { shutdownWithError } from './utils.js';
import { getStorybookUrl, tryAutorunStorybook, checkIsStorybookConnected } from './connection.js';
import { SeleniumWebdriver } from './selenium/webdriver.js';
import { LOCALHOST_REGEXP } from './webdriver.js';
import { isInsideDocker } from './utils.js';
import { sendWorkerMessage } from './messages.js';
import { playwrightDockerFile } from './playwright/docker-file.js';
import { buildImage } from './docker.js';
import { mkdir, writeFile } from 'fs/promises';

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

    // TODO start standalone playwright server (useDocker == false)
    const {
      default: { version },
    } = await import('playwright-core/package.json', { with: { type: 'json' } });

    if (cluster.isWorker) {
      // TODO Re-use dockerImage

      // TODO Use https://hub.docker.com/r/playwright/chrome
      // NOTE It will be possible to use `chrome` browserName
      const { startPlaywrightContainer } = await import('./playwright/docker.js');
      const { browserName } = config.browsers[browser] as BrowserConfigObject;

      const imageName = `creevey/${browserName}:v${version}`;
      const host = await startPlaywrightContainer(imageName, options.debug);

      return host;
    } else {
      const browsers = [...new Set(Object.values(config.browsers).map((c) => (c as BrowserConfigObject).browserName))];
      await Promise.all(
        browsers.map(async (browserName) => {
          const imageName = `creevey/${browserName}:v${version}`;
          const dockerfile = playwrightDockerFile(browserName, version);

          await buildImage(imageName, dockerfile);
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

  if (cluster.isPrimary && process.env.CI !== 'true') {
    const url = await getStorybookUrl(config);

    if (!url) {
      logger().error(`Creevey can't access storybook. Set \`storybookUrl\` or \`resolveStorybookUrl\` in config`);
      shutdownWithError();
      return;
    }

    if (url && config.storybookAutorunCmd) {
      logger().info(`Storybook should be started via \`${config.storybookAutorunCmd}\` and be accessible at ${url}`);
      logger().info('Waiting Storybook...');
      await tryAutorunStorybook(url, config.storybookAutorunCmd);
    } else {
      logger().info(`Storybook should be started and be accessible at ${url}`);
      logger().info("Tip: you can start Storybook automatically by adding `storybookAutorunCmd` to Creevey's config");
      logger().info('Waiting Storybook...');
    }

    const isConnected = await checkIsStorybookConnected(url);
    if (isConnected) {
      logger().info('Storybook connected!\n');
    } else {
      logger().error('Storybook is not responding. Please start Storybook and restart Creevey');
      shutdownWithError();
    }
  }

  switch (true) {
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

      const resolveApi = (await import('./master/server.js')).start(config.reportDir, port, ui);

      return (await import('./master/start.js')).start(gridUrl, config, options, resolveApi);
    }
    default: {
      logger().info(`Starting Worker for ${browser}`);

      // NOTE: We assume that we pass `gridUrl` to worker CLI options
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return (await import('./worker/start.js')).start(browser, gridUrl!, config, options);
    }
  }
}
