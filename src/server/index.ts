import cluster from 'cluster';
import { readConfig } from '../config';
import { Options, Config } from '../types';

export default function (options: Options): void {
  const config: Config = readConfig(options);
  const { browser, update, webpack } = options;

  switch (true) {
    case update: {
      require('./master/update').default(config);
      return;
    }
    case webpack: {
      require('./master/webpack').default(config);
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
