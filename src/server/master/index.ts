import path from 'path';
import { writeFileSync, copyFile, readdir, mkdir, existsSync } from 'fs';
import { promisify } from 'util';
import master from './master';
import creeveyApi, { CreeveyApi } from './api';
import { Config, Options, isDefined } from '../../types';
import { shutdown, shutdownWorkers, testsToImages, readDirRecursive } from '../utils';
import { subscribeOn } from '../messages';
import Runner from './runner';
import { logger } from '../logger';

const copyFileAsync = promisify(copyFile);
const readdirAsync = promisify(readdir);
const mkdirAsync = promisify(mkdir);

async function copyStatics(reportDir: string): Promise<void> {
  const clientDir = path.join(__dirname, '../../client/web');
  const files = (await readdirAsync(clientDir, { withFileTypes: true }))
    .filter((dirent) => dirent.isFile() && !dirent.name.endsWith('.d.ts') && !dirent.name.endsWith('.tsx'))
    .map((dirent) => dirent.name);
  await mkdirAsync(reportDir, { recursive: true });
  for (const file of files) {
    await copyFileAsync(path.join(clientDir, file), path.join(reportDir, file));
  }
}

function reportDataModule<T>(data: T): string {
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
    logger.warn('We found unnecessary screenshot images, those can be safely removed:\n', unnecessaryImages.join('\n'));
  }
}

export default async function (config: Config, options: Options, resolveApi: (api: CreeveyApi) => void): Promise<void> {
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
      runner?.stop();
    } else {
      void shutdownWorkers();
    }
  });

  runner = await master(config, { watch: options.ui, debug: options.debug, port: options.port });

  if (options.saveReport) {
    await copyStatics(config.reportDir);
    runner.on('stop', () =>
      writeFileSync(path.join(config.reportDir, 'data.js'), reportDataModule(runner?.status.tests)),
    );
  }

  if (options.ui) {
    resolveApi(creeveyApi(runner));
    logger.info(`Started on http://localhost:${options.port}`);
  } else {
    if (Object.values(runner.status.tests).filter((test) => test && !test.skip).length == 0) {
      logger.warn("Don't have any tests to run");
      // eslint-disable-next-line no-process-exit
      void shutdownWorkers().then(() => process.exit());
      return;
    }
    runner.once('stop', () => {
      const tests = Object.values(runner?.status.tests ?? {});
      const isSuccess = tests
        .filter(isDefined)
        .filter(({ skip }) => !skip)
        .every(({ status }) => status == 'success');
      // TODO output summary
      process.exitCode = isSuccess ? 0 : -1;
      if (!config.failFast) outputUnnecessaryImages(config.screenDir, testsToImages(tests));
      // eslint-disable-next-line no-process-exit
      void shutdownWorkers().then(() => process.exit());
    });
    // TODO grep
    runner.start(Object.keys(runner.status.tests));
  }
}
