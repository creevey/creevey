import cluster from 'cluster';
import { readConfig, defaultBrowser } from './config';
import { Options, Config, BrowserConfig } from '../types';
import { logger } from './logger';

// NOTE: Impure function, mutate config by adding gridUrl prop
async function startWebdriverServer(config: Config, options: Options): Promise<void> {
  if (config.useDocker) {
    return (await import('./docker')).default(config, options.browser, async () =>
      (await import('./selenium/selenoid')).startSelenoidContainer(config, options.debug),
    );
  } else {
    return (await import('./selenium/selenoid')).startSelenoidStandalone(config, options.debug);
  }
}

export default async function (options: Options): Promise<void> {
  const config = await readConfig(options);
  const { browser = defaultBrowser, extract, tests, update, webpack, ui, port } = options;

  if (!config) return;

  // NOTE: We don't need docker nor selenoid for webpack or update options
  if (
    !(config.gridUrl || (Object.values(config.browsers) as BrowserConfig[]).every(({ gridUrl }) => gridUrl)) &&
    !extract &&
    !webpack &&
    !tests &&
    !update
  ) {
    await startWebdriverServer(config, options);
  }

  switch (true) {
    case Boolean(extract) || tests: {
      return (await import('./extract')).default(config, options);
    }
    case Boolean(update): {
      return (await import('./update')).default(config, typeof update == 'string' ? update : undefined);
    }
    case webpack: {
      logger.info('Starting Webpack Compiler');

      return (await import('./loaders/webpack/compile')).default(config, options);
    }
    case cluster.isMaster: {
      logger.info('Starting Master Process');

      const resolveApi = (await import('./master/server')).default(config.reportDir, port, ui);

      return (await import('./master')).default(config, options, resolveApi);
    }
    default: {
      logger.info(`Starting Worker for ${browser}`);

      return (await import('./worker')).default(config, { ...options, browser });
    }
  }
}
