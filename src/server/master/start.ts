import path from 'path';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import master from './master.js';
import { CreeveyApi } from './api.js';
import { Config, isDefined } from '../../types.js';
import { Options } from '../../schema.js';
import { shutdownWorkers, testsToImages, readDirRecursive, copyStatics } from '../utils.js';
import { subscribeOn } from '../messages.js';
import Runner from './runner.js';
import { logger } from '../logger.js';
import { sendScreenshotsCount } from '../telemetry.js';
import { start as startServer } from './server.js';
import chalk from 'chalk';

async function outputUnnecessaryImages(imagesDir: string, reportDir: string, images: Set<string>): Promise<void> {
  if (!existsSync(imagesDir)) return;
  const unnecessaryImages = readDirRecursive(imagesDir)
    .map((imagePath) => path.posix.relative(imagesDir, imagePath))
    .filter((imagePath) => !images.has(imagePath));
  if (unnecessaryImages.length > 0) {
    const filePath = path.join(reportDir, 'unnecessary-images.txt');
    const content = unnecessaryImages.join('\\n');
    await writeFile(filePath, content);
  }
}

async function outputSummary(runner: Runner, config: Config, options: Options) {
  const tests = Object.values(runner.status.tests);
  const isSuccess = tests
    .filter(isDefined)
    .filter(({ skip }) => !skip)
    .every(({ status }) => status == 'success');

  const total = tests.filter(isDefined).length;
  const skipped = tests.filter(isDefined).filter((t) => t.skip).length;
  const passed = tests.filter(isDefined).filter((t) => !t.skip && t.status === 'success').length;
  const failed = tests.filter(isDefined).filter((t) => !t.skip && t.status === 'failed').length;

  console.log('');

  if (failed > 0) {
    logger().error(chalk.bold('failed tests:'));
    tests
      .filter(isDefined)
      .filter((t) => !t.skip && t.status === 'failed')
      .forEach((t) => {
        const err = t.results?.[t.results.length - 1]?.error?.split('\n')[0] ?? '';
        logger().error(
          chalk.red.bold(`${t.storyPath.join('/')}/${[t.testName, t.browser].filter(Boolean).join('/')}:`),
          err.replace(/^Error: /, ''),
        );
      });
  }

  console.log('');

  logger().info(chalk.blue.bold('test run summary:'));
  logger().info(`  ${chalk.green('total')}: ${total}`);
  logger().info(`  ${chalk.yellow('skipped')}: ${skipped}`);
  logger().info(`  ${chalk.green('passed')}: ${passed}`);
  logger().info(`  ${chalk.red('failed')}: ${failed}`);

  process.exitCode = isSuccess ? 0 : -1;
  if (!config.failFast) await outputUnnecessaryImages(config.screenDir, config.reportDir, testsToImages(tests));
  await sendScreenshotsCount(config, options, runner.status)
    .catch((reason: unknown) => {
      const error = reason instanceof Error ? (reason.stack ?? reason.message) : (reason as string);
      logger().warn(`Can't send telemetry: ${error}`);
    })
    .finally(() => {
      // NOTE: Take some time to kill processes
      void shutdownWorkers().then(() => setTimeout(() => process.exit(), 500));
    });
}

export async function start(
  gridUrl: string | undefined,
  port: number,
  config: Config,
  options: Options,
): Promise<void> {
  const host = config.host;
  const resolveApi = startServer(config.reportDir, port, options.ui, host);

  let runner: Runner | null = null;
  subscribeOn('shutdown', () => config.hooks.after?.());
  process.on('SIGINT', () => {
    runner?.removeAllListeners('stop');
    if (runner?.isRunning) {
      // TODO Better handle stop
      void Promise.race([
        new Promise((resolve) => setTimeout(resolve, 10000)),
        new Promise((resolve) => runner?.once('stop', resolve)),
      ]).then(() => shutdownWorkers());
      runner.stop();
    } else {
      void shutdownWorkers();
    }
  });

  runner = await master(config, gridUrl);

  runner.on('stop', () => {
    void copyStatics(config.reportDir).then(() => runner.testsManager.saveTestData());
  });

  if (options.ui) {
    // Initialize TestsManager
    const testsManager = runner.testsManager;

    // Create the CreeveyApi instance using the existing runner
    const api = new CreeveyApi(testsManager, runner);

    // Resolve the API for the server
    resolveApi(api);

    logger().info(`Started on http://localhost:${port}`);
  } else {
    if (Object.values(runner.status.tests).filter((test) => test && !test.skip).length == 0) {
      logger().warn("Don't have any tests to run");

      void shutdownWorkers().then(() => process.exit());
      return;
    }
    runner.once('stop', () => {
      void outputSummary(runner, config, options);
    });
    // TODO grep
    runner.start(Object.keys(runner.status.tests));
  }
}
