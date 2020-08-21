import cluster from 'cluster';
import { readConfig, defaultBrowser } from './config';
import { Options, noop } from '../types';

export default async function (options: Options): Promise<void> {
  const config = readConfig(options);
  const { browser = defaultBrowser, storybookBundle, update, webpack } = options;

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
      // TODO remove this after update use `find-cache-dir`
      if (!storybookBundle) throw new Error('Something went wrong');

      console.log('[CreeveyWorker]:', `Starting ${browser}:${process.pid}`);

      process.on('SIGINT', noop);

      return (await import('./worker')).default(config, { ...options, browser, storybookBundle });
    }
  }
}
