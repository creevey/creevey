import path from 'path';
import cluster from 'cluster';
import { readConfig } from '../config';
import { Options, Config } from '../types';

export default function(options: Options): void {
  const config: Config = readConfig(path.resolve(options.config), options);
  const { browser, parser, update } = options;

  // TODO output error if parse && ui
  switch (true) {
    case update: {
      require('./master/update').default(config);
      return;
    }
    case parser: {
      require('./master/parser').default(config);
      return;
    }
    case cluster.isMaster: {
      console.log('[CreeveyMaster]:', `Started with pid ${process.pid}`);

      require('./master').default(config, options);
      return;
    }
    default: {
      console.log('[CreeveyWorker]:', `Started ${browser}:${process.pid}`);

      // TODO Check browser type
      require('./worker').default(config, options);
    }
  }
}
