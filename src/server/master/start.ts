import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { copyFile, readdir, mkdir } from 'fs/promises';
import master from './master.js';
import creeveyApi, { CreeveyApi } from './api.js';
import { Config, Options, isDefined } from '../../types.js';
import { shutdownWorkers, testsToImages, readDirRecursive } from '../utils.js';
import { subscribeOn } from '../messages.js';
import Runner from './runner.js';
import { logger } from '../logger.js';
import { sendScreenshotsCount } from '../telemetry.js';

const importMetaUrl = pathToFileURL(__filename).href;

async function copyStatics(reportDir: string): Promise<void> {
  const clientDir = path.join(path.dirname(fileURLToPath(importMetaUrl)), '../../../dist/client/web');
  const assets = (await readdir(path.join(clientDir, 'assets'), { withFileTypes: true }))
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
  await mkdir(path.join(reportDir, 'assets'), { recursive: true });
  await copyFile(path.join(clientDir, 'index.html'), path.join(reportDir, 'index.html'));
  for (const asset of assets) {
    await copyFile(path.join(clientDir, 'assets', asset), path.join(reportDir, 'assets', asset));
  }
}

function outputUnnecessaryImages(imagesDir: string, images: Set<string>): void {
  if (!existsSync(imagesDir)) return;
  const unnecessaryImages = readDirRecursive(imagesDir)
    .map((imagePath) => path.posix.relative(imagesDir, imagePath))
    .filter((imagePath) => !images.has(imagePath));
  if (unnecessaryImages.length > 0) {
    logger().warn(
      'We found unnecessary screenshot images, those can be safely removed:\n',
      unnecessaryImages.join('\n'),
    );
  }
}

export async function start(
  gridUrl: string | undefined,
  config: Config,
  options: Options,
  resolveApi: (api: CreeveyApi) => void,
): Promise<void> {
  let runner: Runner | null = null;
  if (config.hooks.before) {
    await config.hooks.before();
  }
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
    resolveApi(creeveyApi(runner));
    logger().info(`Started on http://localhost:${options.port}`);
  } else {
    if (Object.values(runner.status.tests).filter((test) => test && !test.skip).length == 0) {
      logger().warn("Don't have any tests to run");

      void shutdownWorkers().then(() => process.exit());
      return;
    }
    runner.once('stop', () => {
      const tests = Object.values(runner.status.tests);
      const isSuccess = tests
        .filter(isDefined)
        .filter(({ skip }) => !skip)
        .every(({ status }) => status == 'success');
      // TODO output summary
      process.exitCode = isSuccess ? 0 : -1;
      if (!config.failFast) outputUnnecessaryImages(config.screenDir, testsToImages(tests));
      void sendScreenshotsCount(config, options, runner.status)
        .catch((reason: unknown) => {
          const error = reason instanceof Error ? (reason.stack ?? reason.message) : (reason as string);
          logger().warn(`Can't send telemetry: ${error}`);
        })
        .finally(() => {
          // NOTE: Take some time to kill processes
          void shutdownWorkers().then(() => setTimeout(() => process.exit(), 500));
        });
    });
    // TODO grep
    runner.start(Object.keys(runner.status.tests));
  }
}
