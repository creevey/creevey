import cluster from 'cluster';
import minimist from 'minimist';
import creevey from './server';
import { noop, Options } from './types';
import { emitWorkerMessage } from './server/messages';
import { isShuttingDown, shutdown, shutdownWorkers } from './server/utils';
import { setDefaultLevel, levels } from 'loglevel';
import { logger } from './server/logger';

function shutdownOnException(reason: unknown): void {
  if (isShuttingDown.current) return;

  const error = reason instanceof Error ? reason.stack ?? reason.message : (reason as string);

  logger.error(error);

  process.exitCode = -1;
  if (cluster.isWorker) emitWorkerMessage({ type: 'error', payload: { error } });
  if (cluster.isPrimary && !isShuttingDown.current) void shutdownWorkers();
}

process.on('uncaughtException', shutdownOnException);
process.on('unhandledRejection', shutdownOnException);
if (cluster.isWorker) process.on('SIGINT', noop);
if (cluster.isPrimary) process.on('SIGINT', shutdown);

const argv = minimist<Options>(process.argv.slice(2), {
  string: ['browser', 'config', 'reporter', 'reportDir', 'screenDir'],
  boolean: ['debug', 'ui', 'saveReport', 'tests'],
  default: { port: 3000, saveReport: true },
  alias: { port: 'p', config: 'c', debug: 'd', update: 'u' },
});

// @ts-expect-error: define log level for storybook
global.LOGLEVEL = argv.debug ? 'debug' : 'warn';
if (argv.debug) {
  logger.setDefaultLevel(levels.DEBUG);
  setDefaultLevel(levels.DEBUG);
} else {
  logger.setDefaultLevel(levels.INFO);
  setDefaultLevel(levels.INFO);
}

void creevey(argv);
