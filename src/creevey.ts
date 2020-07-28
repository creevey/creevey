import cluster from 'cluster';
import minimist from 'minimist';
import chalk from 'chalk';
import creevey from './server';
import { Options, WorkerMessage, noop } from './types';
import { emitMessage, shutdownWorkers } from './utils';

function shutdown(reason: unknown): void {
  const error = reason instanceof Error ? reason.stack ?? reason.message : (reason as string);

  console.log(chalk`[{red FAIL}{grey :${process.pid}}]`, error);

  process.exitCode = -1;
  if (cluster.isWorker) emitMessage<WorkerMessage>({ type: 'error', payload: { status: 'failed', error } });
  if (cluster.isMaster) shutdownWorkers();
}

process.on('uncaughtException', shutdown);
process.on('unhandledRejection', shutdown);
process.on('SIGINT', noop);

const argv = minimist<Options>(process.argv.slice(2), {
  string: ['browser', 'storybookBundle', 'config', 'reporter', 'gridUrl', 'reportDir', 'screenDir'],
  boolean: ['debug', 'ui', 'update', 'saveReport', 'webpack'],
  default: { port: 3000, saveReport: true },
  alias: { port: 'p', config: 'c', debug: 'd', update: 'u' },
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.LOGLEVEL = argv.debug ? 'debug' : 'warn';

void creevey(argv);
