import cluster from 'cluster';
import { readConfig } from '../config';
import { Options } from '../types';

export default function (options: Options): void {
  const config = readConfig(options);
  const { browser, update, webpack } = options;

  if (!config) return;

  switch (true) {
    case update: {
      require('./master/update').default(config);
      return;
    }
    case webpack: {
      console.log('[CreeveyWebpack]:', `Starting with pid ${process.pid}`);

      require('./master/webpack').default(config, options);
      return;
    }
    case cluster.isMaster: {
      console.log('[CreeveyMaster]:', `Starting with pid ${process.pid}`);

      require('./master').default(config, options);
      return;
    }
    default: {
      console.log('[CreeveyWorker]:', `Starting ${browser}:${process.pid}`);

      require('./worker').default(config, options);
    }
  }
}
