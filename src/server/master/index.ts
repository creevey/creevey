import path from 'path';
import { writeFileSync, copyFile, readdir, mkdir, readdirSync, existsSync } from 'fs';
import { promisify } from 'util';
import master from './master';
import creeveyApi, { CreeveyApi } from './api';
import { Config, Options, isDefined } from '../../types';
import { shutdownWorkers, testsToImages } from '../utils';
import { subscribeOn } from '../messages';

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

function readDirRecursive(dirPath: string): string[] {
  return ([] as string[]).concat(
    ...readdirSync(dirPath, { withFileTypes: true }).map((dirent) =>
      dirent.isDirectory() ? readDirRecursive(`${dirPath}/${dirent.name}`) : [`${dirPath}/${dirent.name}`],
    ),
  );
}

function outputUnnecessaryImages(imagesDir: string, images: Set<string>): void {
  if (!existsSync(imagesDir)) return;
  const unnecessaryImages = readDirRecursive(imagesDir)
    .map((imagePath) => path.posix.relative(imagesDir, imagePath))
    .filter((imagePath) => !images.has(imagePath));
  if (unnecessaryImages.length > 0) {
    console.log('We found unnecessary screenshot images, that can be freely removed:');
    unnecessaryImages.forEach((imagePath) => console.log(imagePath));
  }
}

export default async function (config: Config, options: Options, resolveApi: (api: CreeveyApi) => void): Promise<void> {
  if (config.hooks.after) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('beforeExit', async () => {
      await config.hooks.after?.();
      // eslint-disable-next-line no-process-exit
      process.exit();
    });
  }
  if (config.hooks.before) {
    await config.hooks.before();
  }
  const runner = await master(config, options.ui);

  if (options.saveReport) {
    const reportDataPath = path.join(config.reportDir, 'data.js');
    await copyStatics(config.reportDir);
    subscribeOn('shutdown', () => writeFileSync(reportDataPath, reportDataModule(runner.status.tests)));
  }

  if (options.ui) {
    resolveApi(creeveyApi(runner));
    console.log('[Creevey]:', `Started on http://localhost:${options.port}`);
  } else {
    // TODO Exit if runner don't have tests to run
    runner.once('stop', () => {
      const tests = Object.values(runner.status.tests);
      const isSuccess = tests
        .filter(isDefined)
        .filter(({ skip }) => !skip)
        .every(({ status }) => status == 'success');
      // TODO output summary
      process.exitCode = isSuccess ? 0 : -1;
      outputUnnecessaryImages(config.screenDir, testsToImages(tests));
      // eslint-disable-next-line no-process-exit
      void shutdownWorkers().then(() => process.exit());
    });
    // TODO grep
    runner.start(Object.keys(runner.status.tests));
  }
}
