import cluster from 'cluster';
import { readConfig, defaultBrowser } from './config';
import { Options, noop, Config, BrowserConfig } from '../types';

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
  const config = readConfig(options);
  const { browser = defaultBrowser, extract, update, webpack, ui, port } = options;

  if (!config) return;

  const resolveApi = ui && cluster.isMaster ? (await import('./master/server')).default(config.reportDir, port) : noop;
  // NOTE: We don't need docker nor selenoid for webpack or update options
  if (
    !(config.gridUrl || (Object.values(config.browsers) as BrowserConfig[]).every(({ gridUrl }) => gridUrl)) &&
    !extract &&
    !webpack &&
    !update
  ) {
    await startWebdriverServer(config, options);
  }

  switch (true) {
    case Boolean(extract): {
      return (await import('./extract')).default(config, options);
    }
    case update: {
      return (await import('./update')).default(config);
    }
    case webpack: {
      console.log('[CreeveyWebpack]:', `Starting with pid ${process.pid}`);

      return (await import('./webpack')).default(config, options);
    }
    case cluster.isMaster: {
      console.log('[CreeveyMaster]:', `Starting with pid ${process.pid}`);

      return (await import('./master')).default(config, options, resolveApi);
    }
    default: {
      console.log('[CreeveyWorker]:', `Starting ${browser}:${process.pid}`);

      process.on('SIGINT', noop);

      return (await import('./worker')).default(config, { ...options, browser });
    }
  }
}
