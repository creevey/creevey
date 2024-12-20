import cluster from 'cluster';
import { readConfig, defaultBrowser } from './config.js';
import { Options, Config, BrowserConfig } from '../types.js';
import { logger } from './logger.js';

// NOTE: Impure function, mutate config by adding gridUrl prop
async function startWebdriverServer(config: Config, options: Options): Promise<void> {
  if (config.useDocker) {
    return (await import('./docker.js')).initDocker(config, options.browser, async () =>
      (await import('./selenium/selenoid.js')).startSelenoidContainer(config, options.debug),
    );
  } else {
    return (await import('./selenium/selenoid.js')).startSelenoidStandalone(config, options.debug);
  }
}

export default async function (options: Options): Promise<void> {
  const config = await readConfig(options);
  const { browser = defaultBrowser, tests, update, ui, port } = options;

  // NOTE: We don't need docker nor selenoid for webpack or update options
  if (
    !(config.gridUrl || (Object.values(config.browsers) as BrowserConfig[]).every(({ gridUrl }) => gridUrl)) &&
    !tests &&
    !update
  ) {
    await startWebdriverServer(config, options);
  }

  switch (true) {
    case Boolean(update): {
      (await import('./update.js')).update(config, typeof update == 'string' ? update : undefined);
      return;
    }
    case cluster.isPrimary: {
      logger().info('Starting Master Process');

      const resolveApi = (await import('./master/server.js')).start(config.reportDir, port, ui);

      return (await import('./master/index.js')).start(config, options, resolveApi);
    }
    default: {
      logger().info(`Starting Worker for ${browser}`);

      return (await import('./worker/index.js')).start(config, {
        ...options,
        browser,
      });
    }
  }
}
