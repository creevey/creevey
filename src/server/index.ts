import cluster from 'cluster';
import path from 'path';
import sh from 'shelljs';
import { getUserAgent } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
import { readConfig, defaultBrowser } from './config.js';
import {
  Options,
  Config,
  BrowserConfigObject,
  isWorkerMessage,
  WorkerOptions,
  OptionsSchema,
  WorkerOptionsSchema,
} from '../types.js';
import { logger } from './logger.js';
import { getStorybookUrl, checkIsStorybookConnected } from './connection.js';
import { SeleniumWebdriver } from './selenium/webdriver.js';
import { LOCALHOST_REGEXP } from './webdriver.js';
import { isInsideDocker, killTree, resolvePlaywrightBrowserType, shutdownWithError } from './utils.js';
import { sendWorkerMessage, subscribeOn } from './messages.js';
import { buildImage } from './docker.js';
import { mkdir, writeFile } from 'fs/promises';
import assert from 'assert';
import * as v from 'valibot';
import { PlaywrightWebdriver } from 'src/playwright.js';

async function getPlaywrightVersion(): Promise<string> {
  const {
    default: { version },
  } = await import('playwright-core/package.json', { with: { type: 'json' } });
  return version;
}

async function startSelenoid(config: Config, debug = false): Promise<string | undefined> {
  const { startSelenoidContainer, startSelenoidStandalone } = await import('./selenium/selenoid.js');
  const gridUrl = 'http://localhost:4444/wd/hub';
  if (config.useDocker) {
    const host = await startSelenoidContainer(config, debug);
    return isInsideDocker ? gridUrl.replace(LOCALHOST_REGEXP, host) : gridUrl;
  }
  await startSelenoidStandalone(config, debug);
  return gridUrl;
}

async function startPlaywright(config: Config, browser: string, version: string, debug = false): Promise<string> {
  // TODO Re-use dockerImage
  const { startPlaywrightContainer } = await import('./playwright/docker.js');
  const { browserName } = config.browsers[browser] as BrowserConfigObject;

  const imageName = `creevey/${browserName}:v${version}`;
  const host = await startPlaywrightContainer(imageName, browser, config, debug);

  return host;
}

async function buildPlaywright(config: Config, version: string): Promise<void> {
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

async function startWebdriverServer(config: Config, options: Options): Promise<string | undefined> {
  if (config.webdriver === SeleniumWebdriver) {
    return startSelenoid(config, options.debug);
    // TODO Worker might want to use docker image of browser or start standalone selenium
  } else {
    if (config.gridUrl) return undefined;

    if (config.useDocker) {
      const version = await getPlaywrightVersion();
      await buildPlaywright(config, version);
    }
    // TODO Support gridUrl for playwright
    // NOTE: There is no grid for playwright right now
  }
}

async function waitForStorybook(config: Config, options: Options): Promise<void> {
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

// TODO Why docker containers are not deleting after stop?
export default async function (command: 'report' | 'test' | 'worker', options: Options | WorkerOptions): Promise<void> {
  const config = await readConfig(options);

  // TODO Add package.json with `"type": "commonjs"` as workaround for esm packages to load `data.js`
  await mkdir(config.reportDir, { recursive: true });
  await writeFile(path.join(config.reportDir, 'package.json'), '{"type": "commonjs"}');

  await import('./shutdown.js');

  if (v.is(OptionsSchema, options)) {
    const { port, reportDir = config.reportDir } = options;

    if (command == 'report') {
      const { report } = await import('./report.js');
      report(config, reportDir, port);
      return;
    }

    if (cluster.isPrimary) {
      let gridUrl: string | undefined = config.gridUrl;

      if (!(gridUrl || (Object.values(config.browsers) as BrowserConfigObject[]).every(({ gridUrl }) => gridUrl))) {
        gridUrl = await startWebdriverServer(config, options);
      }
      await waitForStorybook(config, options);

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
  }

  if (v.is(WorkerOptionsSchema, options) && cluster.isWorker) {
    let gridUrl = options.gridUrl;
    const { browser = defaultBrowser, debug } = options;

    if (!gridUrl) {
      if (config.webdriver === PlaywrightWebdriver) {
        if (config.useDocker) {
          const version = await getPlaywrightVersion();
          gridUrl = await startPlaywright(config, browser, version, debug);
        } else {
          const { browserName } = config.browsers[browser] as BrowserConfigObject;
          gridUrl = `creevey://${resolvePlaywrightBrowserType(browserName)}`;
        }
      } else {
        assert(gridUrl, 'Grid URL is required for Selenium');
      }
    }

    logger().info(`Starting Worker for ${browser}`);

    return (await import('./worker/start.js')).start(browser, gridUrl, config, options);
  }
}
