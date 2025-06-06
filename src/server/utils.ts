import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import assert from 'assert';
import cluster from 'cluster';
import pidtree from 'pidtree';
import { fileURLToPath, pathToFileURL } from 'url';
import { register as esmRegister } from 'tsx/esm/api';
import { register as cjsRegister } from 'tsx/cjs/api';
import { SkipOptions, SkipOption, isDefined, TestData, noop, ServerTest, Worker } from '../types.js';
import { emitShutdownMessage, emitWorkerMessage, sendShutdownMessage } from './messages.js';
import { LOCALHOST_REGEXP } from './webdriver.js';
import { logger } from './logger.js';

const importMetaUrl = pathToFileURL(__filename).href;

export const isShuttingDown = { current: false };

export const configExt = ['.js', '.mjs', '.ts', '.cjs', '.mts', '.cts'];

const browserTypes = {
  chromium: 'chromium',
  'chromium-headless-shell': 'chromium',
  chrome: 'chromium',
  'chrome-beta': 'chromium',
  msedge: 'chromium',
  'msedge-beta': 'chromium',
  'msedge-dev': 'chromium',
  'bidi-chromium': 'chromium',
  firefox: 'firefox',
  webkit: 'webkit',
} as const;

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

export function shutdownOnException(reason: unknown): void {
  if (isShuttingDown.current) return;

  const error = reason instanceof Error ? (reason.stack ?? reason.message) : (reason as string);

  logger().error(error);

  process.exitCode = -1;
  if (cluster.isWorker) emitWorkerMessage({ type: 'error', payload: { subtype: 'unknown', error } });
  if (cluster.isPrimary) void shutdownWorkers();
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
              if (worker.process.pid) void killTree(worker.process.pid);
            }, 10_000);
            worker.on('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
            sendShutdownMessage(worker);
            worker.disconnect();
          }),
      ),
  );
  emitShutdownMessage();
}

export function gracefullyKill(worker: Worker): void {
  worker.isShuttingDown = true;
  const timeout = setTimeout(() => {
    if (worker.process.pid) void killTree(worker.process.pid);
  }, 10000);
  worker.on('exit', () => {
    clearTimeout(timeout);
  });
  sendShutdownMessage(worker);
  worker.disconnect();
}

export async function killTree(rootPid: number): Promise<void> {
  const pids = await pidtree(rootPid, { root: true });

  pids.forEach((pid) => {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      /* noop */
    }
  });
}

export function shutdownWithError(): void {
  process.exit(1);
}

export function resolvePlaywrightBrowserType(browserName: string): (typeof browserTypes)[keyof typeof browserTypes] {
  assert(
    browserName in browserTypes,
    new Error(`Failed to match browser name "${browserName}" to playwright browserType`),
  );

  return browserTypes[browserName as keyof typeof browserTypes];
}

export async function getCreeveyCache(): Promise<string | undefined> {
  const { default: findCacheDir } = await import('find-cache-dir');
  return findCacheDir({ name: 'creevey', cwd: path.dirname(fileURLToPath(importMetaUrl)) });
}

export async function runSequence(seq: (() => unknown)[], predicate: () => boolean): Promise<boolean> {
  for (const fn of seq) {
    if (predicate()) await fn();
  }
  return predicate();
}

export function getTestPath(test: ServerTest): string[] {
  return [...test.storyPath, test.testName, test.browser].filter(isDefined);
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
  (fs.existsSync('/proc/1/cgroup') && fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker')) ||
  process.env.DOCKER === 'true';

export const downloadBinary = (downloadUrl: string, destination: string): Promise<void> =>
  new Promise((resolve, reject) =>
    https.get(downloadUrl, (response) => {
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

export function tryToLoadTestsData(filename: string): Partial<Record<string, ServerTest>> | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/no-dynamic-require
    return require(filename) as Partial<Record<string, ServerTest>>;
  } catch {
    /* noop */
  }
}

const [nodeVersion] = process.versions.node.split('.').map(Number);
export async function loadThroughTSX<T>(
  callback: (load: (modulePath: string) => Promise<T>) => Promise<T>,
): Promise<T> {
  const unregisterESM = nodeVersion > 18 ? esmRegister() : noop;
  const unregisterCJS = cjsRegister();

  const result = await callback((modulePath) =>
    nodeVersion > 18
      ? import(modulePath)
      : // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/no-dynamic-require
        Promise.resolve(require(modulePath) as T),
  );

  // NOTE: `unregister` type is `(() => Promise<void>) | (() => void)`
  // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
  await unregisterCJS();
  // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
  await unregisterESM();

  return result;
}

export function waitOnUrl(waitUrl: string, timeout: number, delay: number) {
  const urls = [waitUrl];
  if (!LOCALHOST_REGEXP.test(waitUrl)) {
    const parsedUrl = new URL(waitUrl);
    parsedUrl.host = 'localhost';
    urls.push(parsedUrl.toString());
  }
  const startTime = Date.now();
  return Promise.race(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const interval = setInterval(() => {
            http
              .get(url, (response) => {
                if (response.statusCode === 200) {
                  clearInterval(interval);
                  resolve();
                }
              })
              .on('error', () => {
                // Ignore HTTP errors
              });

            if (Date.now() - startTime > timeout) {
              clearInterval(interval);
              reject(new Error(`${url} didn't respond within ${timeout / 1000} seconds`));
            }
          }, delay);
        }),
    ),
  );
}

/**
 * Copies static assets to the report directory
 * @param reportDir Directory where the report will be generated
 */
export async function copyStatics(reportDir: string): Promise<void> {
  const clientDir = path.join(path.dirname(fileURLToPath(importMetaUrl)), '../../dist/client/web');
  const assets = (await fs.promises.readdir(path.join(clientDir, 'assets'), { withFileTypes: true }))
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
  await fs.promises.mkdir(path.join(reportDir, 'assets'), { recursive: true });
  await fs.promises.copyFile(path.join(clientDir, 'index.html'), path.join(reportDir, 'index.html'));
  for (const asset of assets) {
    await fs.promises.copyFile(path.join(clientDir, 'assets', asset), path.join(reportDir, 'assets', asset));
  }
}
