import path from 'path';
import cluster from 'cluster';
import { readConfig } from '../config';
import { Options } from '../types';

export default async function(options: Options) {
  const config = readConfig(path.resolve(options.config)) || { gridUrl: options.gridUrl };
  const { browser, parser, update } = options;

  if (!config.gridUrl) {
    console.log('Please specify `gridUrl`');
    process.exit(-1);
  }

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
