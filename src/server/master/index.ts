import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { copyFile, readdir, mkdir, writeFile } from 'fs/promises';
import master from './master.js';
import creeveyApi, { CreeveyApi } from './api.js';
import { Config, Options, TestData, isDefined } from '../../types.js';
import { shutdown, shutdownWorkers, testsToImages, readDirRecursive } from '../utils.js';
import { subscribeOn } from '../messages.js';
import Runner from './runner.js';
import { logger } from '../logger.js';
import { sendScreenshotsCount } from '../telemetry.js';

const importMetaUrl = pathToFileURL(__filename).href;

async function copyStatics(reportDir: string): Promise<void> {
  const clientDir = path.join(path.dirname(fileURLToPath(importMetaUrl)), '../../client/web');
  const files = (await readdir(clientDir, { withFileTypes: true }))
    .filter((dirent) => dirent.isFile() && !dirent.name.endsWith('.d.ts') && !dirent.name.endsWith('.tsx'))
    .map((dirent) => dirent.name);
  await mkdir(reportDir, { recursive: true });
  for (const file of files) {
    await copyFile(path.join(clientDir, file), path.join(reportDir, file));
  }
}

function reportDataModule(data: Partial<Record<string, TestData>>): string {
  return `
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.__CREEVEY_DATA__ = factory();
  }
}(this, function () { return ${JSON.stringify(data)} }));
`;
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

export async function start(config: Config, options: Options, resolveApi: (api: CreeveyApi) => void): Promise<void> {
  let runner: Runner | null = null;
  if (config.hooks.before) {
    await config.hooks.before();
  }
  subscribeOn('shutdown', () => config.hooks.after?.());
  process.removeListener('SIGINT', shutdown);
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

  runner = await master(config, { watch: options.ui, debug: options.debug, port: options.port });

  runner.on('stop', () => {
    void copyStatics(config.reportDir).then(() =>
      writeFile(path.join(config.reportDir, 'data.js'), reportDataModule(runner.status.tests)),
    );
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
          void shutdownWorkers().then(() => process.exit());
        });
    });
    // TODO grep
    runner.start(Object.keys(runner.status.tests));
  }
}
