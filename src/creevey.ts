import cluster from 'cluster';
import * as v from 'valibot';
import Logger from 'loglevel';
import { cac } from 'cac';
import { Options, OptionsSchema, WorkerOptions, WorkerOptionsSchema } from './types.js';
import { version } from '../package.json';
import { logger, setRootName } from './server/logger.js';
import creevey from './server/index.js';
import './server/shutdown.js';

const workerCli = cac('worker');
workerCli
  .command('worker', 'Start worker')
  .option('--browser <browser>', 'Specify browser to run tests')
  .option('--grid-url <url>', 'Selenium grid URL')
  .option('-d, --debug', 'Enable debug mode')
  .option('-c, --config <config>', 'Path to config file')
  .option('-p, --port <port>', 'Port for UI server', { default: 3000 })
  .option('--trace', 'Enable trace mode (more verbose than debug)')
  .option('--report-dir <dir>', 'Directory for test reports')
  .option('--screen-dir <dir>', 'Directory for reference images')
  .option('--storybook-url <url>', 'Storybook server URL')
  .option('--odiff', 'Use odiff for image comparison');
workerCli.parse();

const cli = cac('creevey');

cli
  .command('report [reportDir]', 'Launch web UI to review and approve test results')
  .option('-c, --config <config>', 'Path to config file')
  .option('-p, --port <port>', 'Port for UI server', { default: 3000 })
  .option('--screen-dir <dir>', 'Directory for reference images');

// TODO Add ability to start specific tests/files/stories
cli
  .command('test [options]', 'Run tests')
  .option('--ui', 'Launch web UI for running tests and reviewing test results')
  .option('-s, --storybook-start [cmd]', 'Start Storybook automatically')
  .option('-c, --config <config>', 'Path to config file')
  .option('-d, --debug', 'Enable debug mode')
  .option('-p, --port <port>', 'Port for UI server', { default: 3000 })
  .option('--fail-fast', 'Stop tests after first failure')
  .option('--report-dir <dir>', 'Directory for test reports')
  .option('--screen-dir <dir>', 'Directory for reference images')
  .option('--storybook-url <url>', 'Storybook server URL')
  .option('--storybook-port <port>', 'Storybook server port')
  .option('--reporter <reporter>', '[DEPRECATED] Use config file instead')
  .option('--odiff', 'Use odiff for image comparison')
  .option('--trace', 'Enable trace mode (more verbose than debug)')
  .option('--no-docker', 'Disable Docker usage');
cli.version(process.env.npm_package_version ?? version);
cli.help();
cli.parse();

if (
  process.argv.includes('--help') ||
  process.argv.includes('-h') ||
  process.argv.includes('--version') ||
  process.argv.includes('-v')
) {
  process.exit(0);
}

const command = cluster.isWorker ? workerCli.matchedCommandName : cli.matchedCommandName;
const args = cluster.isWorker ? workerCli.args : cli.args;
let options: Options | WorkerOptions;

if (!command || (command !== 'report' && command !== 'test' && command !== 'worker')) {
  console.error('Error: No known command specified\n');
  cli.outputHelp();
  process.exit(1);
}

try {
  options = cluster.isWorker ? v.parse(WorkerOptionsSchema, workerCli.options) : v.parse(OptionsSchema, cli.options);
} catch (error: unknown) {
  if (v.isValiError(error)) {
    console.error('Options validation failed:');
    for (const issue of error.issues) {
      const path = issue.path?.map((p) => p.key).join('.');
      console.error(`  ${path ? `${path}: ` : ''}${issue.message}`);
    }
  } else {
    console.error(error);
  }
  console.log();
  cli.matchedCommand?.outputHelp();

  process.exit(1);
}

if (v.is(OptionsSchema, options) && command == 'report' && args.length > 0) {
  options.reportDir = args[0];
  options.ui = true;
}

// Handle browser name for logging
if (v.is(WorkerOptionsSchema, options)) setRootName(options.browser);

if (cluster.isPrimary && 'reporter' in options) {
  logger().warn(`--reporter option has been removed please describe reporter in config file:
    import { reporters } from 'mocha';

    const config = {
      reporter: reporters.${options.reporter},
    };

    export default config;
  `);
}

// @ts-expect-error: define log level for storybook
global.LOGLEVEL = options.trace ? 'trace' : options.debug ? 'debug' : 'warn';
if (options.trace) {
  logger().setDefaultLevel(Logger.levels.TRACE);
  Logger.setDefaultLevel(Logger.levels.TRACE);
} else if (options.debug) {
  logger().setDefaultLevel(Logger.levels.DEBUG);
  Logger.setDefaultLevel(Logger.levels.DEBUG);
} else {
  logger().setDefaultLevel(Logger.levels.INFO);
  Logger.setDefaultLevel(Logger.levels.INFO);
}

void creevey(command, options);
