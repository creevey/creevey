import cluster from 'cluster';
import { readConfig, defaultBrowser } from './config';
import { Options, noop } from '../types';

export default async function (options: Options): Promise<void> {
  const config = await readConfig(options);
  const { browser = defaultBrowser, update, webpack } = options;

  if (!config) return;

  switch (true) {
    case update: {
      return (await import('./master/update')).default(config);
    }
    case webpack: {
      console.log('[CreeveyWebpack]:', `Starting with pid ${process.pid}`);

      return (await import('./master/webpack')).default(config, options);
    }
    case cluster.isMaster: {
      console.log('[CreeveyMaster]:', `Starting with pid ${process.pid}`);

      return (await import('./master')).default(config, options);
    }
    default: {
      console.log('[CreeveyWorker]:', `Starting ${browser}:${process.pid}`);

      process.on('SIGINT', noop);

      return (await import('./worker')).default(config, { ...options, browser });
    }
  }
}
