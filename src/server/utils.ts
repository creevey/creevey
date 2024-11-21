import fs from 'fs';
import { get } from 'https';
import cluster from 'cluster';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import findCacheDir from 'find-cache-dir';
import { register as esmRegister } from 'tsx/esm/api';
import { register as cjsRegister } from 'tsx/cjs/api';
import { SkipOptions, SkipOption, isDefined, TestData, noop, ServerTest, Worker } from '../types.js';
import { emitShutdownMessage, sendShutdownMessage } from './messages.js';

const importMetaUrl = pathToFileURL(__filename).href;

export const isShuttingDown = { current: false };

export const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/i;

export const configExt = ['.js', '.mjs', '.ts', '.cjs', '.mts', '.cts'];

export const skipOptionKeys = ['in', 'kinds', 'stories', 'tests', 'reason'];

function matchBy(pattern: string | string[] | RegExp | undefined, value: string): boolean {
  return (
    (typeof pattern == 'string' && pattern == value) ||
    (Array.isArray(pattern) && pattern.includes(value)) ||
    (pattern instanceof RegExp && pattern.test(value)) ||
    !isDefined(pattern)
  );
}

export function shouldSkip(
  browser: string,
  meta: {
    title: string;
    name: string;
  },
  skipOptions: SkipOptions,
  test?: string,
): string | boolean {
  if (typeof skipOptions != 'object') {
    return skipOptions;
  }
  for (const skipKey in skipOptions) {
    const reason = shouldSkipByOption(browser, meta, skipOptions[skipKey], skipKey, test);
    if (reason) return reason;
  }
  return false;
}

export function shouldSkipByOption(
  browser: string,
  meta: {
    title: string;
    name: string;
  },
  skipOption: SkipOption | SkipOption[],
  reason: string,
  test?: string,
): string | boolean {
  if (Array.isArray(skipOption)) {
    for (const skip of skipOption) {
      const result = shouldSkipByOption(browser, meta, skip, reason, test);
      if (result) return result;
    }
    return false;
  }

  const { in: browsers, kinds, stories, tests } = skipOption;
  const { title, name } = meta;
  const skipByBrowser = matchBy(browsers, browser);
  const skipByKind = matchBy(kinds, title);
  const skipByStory = matchBy(stories, name);
  const skipByTest = !isDefined(test) || matchBy(tests, test);

  return skipByBrowser && skipByKind && skipByStory && skipByTest && reason;
}

export async function shutdownWorkers(): Promise<void> {
  isShuttingDown.current = true;
  await Promise.all(
    Object.values(cluster.workers ?? {})
      .filter(isDefined)
      .filter((worker) => worker.isConnected())
      .map(
        (worker) =>
          new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              worker.kill();
            }, 10000);
            worker.on('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
            sendShutdownMessage(worker);
          }),
      ),
  );
  emitShutdownMessage();
}

export function gracefullyKill(worker: Worker): void {
  worker.isShuttingDown = true;
  const timeout = setTimeout(() => {
    worker.kill();
  }, 10000);
  worker.on('exit', () => {
    clearTimeout(timeout);
  });
  sendShutdownMessage(worker);
}

export function shutdown(): void {
  process.exit();
}

export function getCreeveyCache(): string | undefined {
  return findCacheDir({ name: 'creevey', cwd: dirname(fileURLToPath(importMetaUrl)) });
}

export async function runSequence(seq: (() => unknown)[], predicate: () => boolean): Promise<void> {
  for (const fn of seq) {
    if (predicate()) await fn();
  }
}

export function testsToImages(tests: (TestData | undefined)[]): Set<string> {
  return new Set(
    ([] as string[]).concat(
      ...tests
        .filter(isDefined)
        .map(({ browser, testName, storyPath, results }) =>
          Object.keys(results?.slice(-1)[0]?.images ?? {}).map(
            (image) =>
              `${[...storyPath, testName, browser, browser == image ? undefined : image]
                .filter(isDefined)
                .join('/')}.png`,
          ),
        ),
    ),
  );
}

// https://tuhrig.de/how-to-know-you-are-inside-a-docker-container/
export const isInsideDocker =
  fs.existsSync('/proc/1/cgroup') && fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker');

export const downloadBinary = (downloadUrl: string, destination: string): Promise<void> =>
  new Promise((resolve, reject) =>
    get(downloadUrl, (response) => {
      if (response.statusCode == 302) {
        const { location } = response.headers;
        if (!location) {
          reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));
          return;
        }

        resolve(downloadBinary(location, destination));
        return;
      }
      if (response.statusCode != 200) {
        reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));
        return;
      }

      const fileStream = fs.createWriteStream(destination);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (error) => {
        fs.unlink(destination, noop);
        reject(error);
      });
    }),
  );

export function readDirRecursive(dirPath: string): string[] {
  return ([] as string[]).concat(
    ...fs
      .readdirSync(dirPath, { withFileTypes: true })
      .map((dirent) =>
        dirent.isDirectory() ? readDirRecursive(`${dirPath}/${dirent.name}`) : [`${dirPath}/${dirent.name}`],
      ),
  );
}

const _require = createRequire(importMetaUrl);
export function tryToLoadTestsData(filename: string): Partial<Record<string, ServerTest>> | undefined {
  try {
    return _require(filename) as Partial<Record<string, ServerTest>>;
  } catch {
    /* noop */
  }
}

const [nodeVersion] = process.versions.node.split('.').map(Number);
export async function loadThroughTSX<T>(
  callback: (load: (modulePath: string) => Promise<T>) => Promise<T>,
): Promise<T> {
  const unregister = nodeVersion > 18 ? esmRegister() : cjsRegister();

  const result = await callback((modulePath) =>
    nodeVersion > 18
      ? import(modulePath)
      : // eslint-disable-next-line @typescript-eslint/no-require-imports
        Promise.resolve(require(modulePath) as T),
  );

  // NOTE: `unregister` type is `(() => Promise<void>) | (() => void)`
  // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
  await unregister();

  return result;
}
