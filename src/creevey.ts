import cluster from 'cluster';
import minimist from 'minimist';
import chalk from 'chalk';
import creevey from './server';
import { Options, WorkerMessage } from './types';
import { emitMessage } from './utils';

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason.stack ?? reason.message : (reason as string);

  console.log(chalk`[{red FAIL}{grey :${process.pid}}]`, error);

  if (cluster.isWorker) {
    process.on('disconnect', () => setTimeout(() => process.exit(0), 30000));
  }

  if (emitMessage<WorkerMessage>({ type: 'error', payload: { status: 'failed', error } })) return;
  cluster.disconnect(() => process.exit(-1));
});

const argv = minimist<Options>(process.argv.slice(2), {
  string: ['browser', 'storybookBundle', 'config', 'reporter', 'gridUrl', 'reportDir', 'screenDir'],
  boolean: ['debug', 'ui', 'update', 'saveReport', 'webpack'],
  default: { port: 3000, saveReport: true },
  alias: { port: 'p', config: 'c', debug: 'd', update: 'u' },
});

creevey(argv);
