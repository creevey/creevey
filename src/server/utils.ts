import { createWriteStream, existsSync, readFileSync, readdirSync, unlink } from 'fs';
import cluster from 'cluster';
import { SkipOptions, SkipOption, isDefined, TestData, noop, isFunction } from '../types';
import { emitShutdownMessage, sendShutdownMessage } from './messages';
import findCacheDir from 'find-cache-dir';
import { get } from 'https';

export const isShuttingDown = { current: false };

export const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/i;

export const extensions = ['.js', '.jsx', '.ts', '.tsx'];

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
    kind: string;
    story: string;
  },
  skipOptions: SkipOptions,
  test?: string,
): string | boolean {
  if (typeof skipOptions != 'object') {
    return skipOptions;
  }
  if (Array.isArray(skipOptions)) {
    for (const skip of skipOptions) {
      const reason = shouldSkip(browser, meta, skip, test);
      if (reason) return reason;
    }
    return false;
  }
  let hasSkipOptionKeys = false;
  for (const skipKey in skipOptions) {
    if (skipOptionKeys.includes(skipKey)) {
      hasSkipOptionKeys = true;
      continue;
    }
    const reason = shouldSkip(
      browser,
      meta,
      { reason: skipKey, ...(skipOptions as Record<string, SkipOption | SkipOption[]>)[skipKey] },
      test,
    );
    if (reason) return reason;
  }
  if (!hasSkipOptionKeys) return false;

  const { in: browsers, kinds, stories, tests, reason = true } = skipOptions as SkipOption;
  const { kind, story } = meta;
  const skipByBrowser = matchBy(browsers, browser);
  const skipByKind = matchBy(kinds, kind);
  const skipByStory = matchBy(stories, story);
  const skipByTest = !isDefined(test) || matchBy(tests, test);

  return skipByBrowser && skipByKind && skipByStory && skipByTest && reason;
}

export async function shutdownWorkers(): Promise<void> {
  isShuttingDown.current = true;
  await Promise.all(
    Object.values(cluster.workers)
      .filter(isDefined)
      .filter((worker) => worker.isConnected())
      .map(
        (worker) =>
          new Promise<void>((resolve) => {
            const timeout = setTimeout(() => worker.kill(), 10000);
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

export function shutdown(): void {
  // eslint-disable-next-line no-process-exit
  process.exit();
}

export function getCreeveyCache(): string {
  return findCacheDir({ name: 'creevey', cwd: __dirname }) as string;
}

export async function runSequence(seq: Array<() => unknown>, predicate: () => boolean): Promise<void> {
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
export const isInsideDocker = existsSync('/proc/1/cgroup') && /docker/.test(readFileSync('/proc/1/cgroup', 'utf8'));

export const downloadBinary = (downloadUrl: string, destination: string): Promise<void> =>
  new Promise((resolve, reject) =>
    get(downloadUrl, (response) => {
      if (response.statusCode == 302) {
        const { location } = response.headers;
        if (!location)
          return reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));

        return resolve(downloadBinary(location, destination));
      }
      if (response.statusCode != 200)
        return reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));

      const fileStream = createWriteStream(destination);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (error) => {
        unlink(destination, noop);
        reject(error);
      });
    }),
  );

export function removeProps(obj: Record<string, unknown>, propPath: (string | ((key: string) => boolean))[]): void {
  const [prop, ...restPath] = propPath;
  if (restPath.length > 0) {
    if (typeof prop == 'string') obj[prop] && removeProps(obj[prop] as Record<string, unknown>, restPath);
    if (isFunction(prop))
      Object.keys(obj)
        .filter(prop)
        .forEach((key) => obj[key] && removeProps(obj[key] as Record<string, unknown>, restPath));
  } else {
    if (typeof prop == 'string') delete obj[prop];
    if (isFunction(prop))
      Object.keys(obj)
        .filter(prop)
        .forEach((key) => delete obj[key]);
  }
}

export function readDirRecursive(dirPath: string): string[] {
  return ([] as string[]).concat(
    ...readdirSync(dirPath, { withFileTypes: true }).map((dirent) =>
      dirent.isDirectory() ? readDirRecursive(`${dirPath}/${dirent.name}`) : [`${dirPath}/${dirent.name}`],
    ),
  );
}
