import cluster from 'cluster';
import minimist from 'minimist';
import chalk from 'chalk';
import { addHook } from 'pirates';
import creevey from './server';
import { Options } from './types';

addHook(() => '', {
  exts: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.eot',
    '.otf',
    '.svg',
    '.ttf',
    '.woff',
    '.woff2',
    '.css',
    '.less',
    '.scss',
    '.styl',
  ],
  ignoreNodeModules: false,
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason.stack || reason.message : reason;

  console.log(chalk`[{red FAIL}{grey :${process.pid}}]`, error);

  if (process.send) {
    process.send(JSON.stringify({ type: 'error', payload: { status: 'failed', error } }));
    return;
  }
  cluster.disconnect(() => process.exit(-1));
});

const argv = minimist<Options>(process.argv.slice(2), {
  string: ['config', 'browser', 'reporter', 'gridUrl', 'reportDir', 'screenDir'],
  boolean: ['debug', 'ui', 'update'],
  default: { config: './creevey.config', ui: false, port: 3000, debug: false },
  alias: { port: 'p', config: 'c', debug: 'd', update: 'u' },
});

creevey(argv);
