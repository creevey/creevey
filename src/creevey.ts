import cluster from 'cluster';
import minimist from 'minimist';
import creevey from './server/index.js';
import { Options } from './types.js';
import { emitWorkerMessage } from './server/messages.js';
import { isShuttingDown, shutdownWorkers } from './server/utils.js';
import Logger from 'loglevel';
import { logger, setRootName } from './server/logger.js';

function shutdownOnException(reason: unknown): void {
  if (isShuttingDown.current) return;

  const error = reason instanceof Error ? (reason.stack ?? reason.message) : (reason as string);

  logger().error(error);

  process.exitCode = -1;
  if (cluster.isWorker) emitWorkerMessage({ type: 'error', payload: { subtype: 'unknown', error } });
  if (cluster.isPrimary) void shutdownWorkers();
}

process.on('uncaughtException', shutdownOnException);
process.on('unhandledRejection', shutdownOnException);
// TODO SIGINT Stuck with selenium
process.on('SIGINT', () => {
  if (isShuttingDown.current) {
    process.exit(-1);
  }
  isShuttingDown.current = true;
});

const argv = minimist<Options>(process.argv.slice(2), {
  string: ['browser', 'config', 'reporter', 'reportDir', 'screenDir', 'gridUrl', 'storybookUrl'],
  boolean: ['debug', 'trace', 'ui', 'odiff'],
  default: { port: 3000 },
  alias: { port: 'p', config: 'c', debug: 'd', update: 'u' },
});

if ('port' in argv && !isNaN(argv.port)) argv.port = Number(argv.port);
if ('browser' in argv && argv.browser) setRootName(argv.browser);

// eslint-disable-next-line @typescript-eslint/no-deprecated
if (cluster.isPrimary && argv.reporter) {
  logger().warn(`--reporter option has been removed please describe reporter in config file:
    import { reporters } from 'mocha';

    const config = {
      reporter: reporters.${
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        argv.reporter
      },
    };

    export default config;
  `);
}

// @ts-expect-error: define log level for storybook
global.LOGLEVEL = argv.trace ? 'trace' : argv.debug ? 'debug' : 'warn';
if (argv.trace) {
  logger().setDefaultLevel(Logger.levels.TRACE);
  Logger.setDefaultLevel(Logger.levels.TRACE);
} else if (argv.debug) {
  logger().setDefaultLevel(Logger.levels.DEBUG);
  Logger.setDefaultLevel(Logger.levels.DEBUG);
} else {
  logger().setDefaultLevel(Logger.levels.INFO);
  Logger.setDefaultLevel(Logger.levels.INFO);
}

void creevey(argv);
