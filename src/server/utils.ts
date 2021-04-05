import fs, { createWriteStream, existsSync, readFileSync, unlink } from 'fs';
import path from 'path';
import cluster from 'cluster';
import { SkipOptions, isDefined, TestData, noop, isFunction } from '../types';
import { emitShutdownMessage, sendShutdownMessage } from './messages';
import findCacheDir from 'find-cache-dir';
import { get } from 'https';

export const isShuttingDown = { current: false };

export const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/i;

export const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.es', '.es6'];

export const supportedFrameworks = [
  'react',
  'vue',
  'angular',
  'marionette',
  'mithril',
  'marko',
  'html',
  'svelte',
  'riot',
  'ember',
  'preact',
  'rax',
  'aurelia',
  'server',
  'web-components',
];

const compilers = {
  '@babel/register': ({ extension }: { extension: string }) => (hook: (...args: unknown[]) => void) =>
    hook({ rootMode: 'upward-optional', extensions: [extension] }),
  'ts-node': ({ rootDir }: { rootDir: string }) => (hook: { register: (...args: unknown[]) => void }) => {
    // NOTE `dir` options are supported only from `ts-node@>=8.6`, but default angular project use older version
    hook.register({ project: path.join(rootDir, 'tsconfig.json') });
    // NOTE This need to support tsconfig aliases
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    require('tsconfig-paths/register').loadConfig(rootDir);
  },
};

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
  if (typeof skipOptions == 'string') {
    return skipOptions;
  }
  if (Array.isArray(skipOptions)) {
    return skipOptions.map((skipOption) => shouldSkip(browser, meta, skipOption, test)).find(Boolean) || false;
  }
  const { in: browsers, kinds, stories, tests, reason = true } = skipOptions;
  const { kind, story } = meta;
  const skipByBrowser = matchBy(browsers, browser);
  const skipByKind = matchBy(kinds, kind);
  const skipByStory = matchBy(stories, story);
  const skipByTest = !isDefined(test) || matchBy(tests, test);

  return skipByBrowser && skipByKind && skipByStory && skipByTest && reason;
}

export function loadCompilers(rootDir: string, extension: string): void {
  Object.entries(compilers).forEach(([moduleName, register]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      register({ rootDir, extension })(require(moduleName));
    } catch (error) {
      // ignore error
    }
  });
}

export function requireConfig<T>(configPath: string): T {
  let ext = path.extname(configPath);
  if (!ext || ext == '.config') {
    ext = extensions.find((key) => fs.existsSync(`${configPath}${key}`)) || ext;
    configPath += ext;
  }
  try {
    require(configPath);
  } catch (error) {
    const childModules = require.cache[__filename]?.children ?? [];
    // NOTE If config load failed then the module of config can't have child modules
    if (childModules.find((child) => child.filename == configPath)?.children.length != 0) {
      throw error;
    }
    const configDir = isDefined(configPath) ? path.parse(configPath).dir : process.cwd();

    loadCompilers(configDir, ext);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const configModule = require(configPath);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return configModule && configModule.__esModule ? configModule.default : configModule;
}

export async function shutdownWorkers(): Promise<void> {
  isShuttingDown.current = true;
  emitShutdownMessage();
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
}

export function getStorybookParentDirectory(): string {
  return require.resolve('@storybook/core').split('@storybook')[0];
}

export function getStorybookVersion(): string {
  const parentDir = getStorybookParentDirectory();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version } = require(path.join(parentDir, '@storybook', 'core', 'package.json')) as { version: string };

  return version;
}

export function isStorybookVersionLessThan(major: number, minor?: number): boolean {
  const [sbMajor, sbMinor] = (process.env.__CREEVEY_STORYBOOK_VERSION__ ?? getStorybookVersion()).split('.');

  return Number(sbMajor) < major || (minor != undefined && Number(sbMajor) == major && Number(sbMinor) < minor);
}

export function isStorybookVersion(major: number, minor?: number): boolean {
  const [sbMajor, sbMinor] = (process.env.__CREEVEY_STORYBOOK_VERSION__ ?? getStorybookVersion()).split('.');

  return Number(sbMajor) == major || (minor != undefined && Number(sbMajor) == major && Number(sbMinor) == minor);
}

export function getStorybookFramework(): string {
  const parentDir = getStorybookParentDirectory();

  const framework =
    process.env.__CREEVEY_STORYBOOK_FRAMEWORK__ ??
    supportedFrameworks.find((framework) => {
      try {
        return require.resolve(path.join(parentDir, `@storybook/${framework}`));
      } catch (_) {
        return false;
      }
    });

  if (!framework)
    throw new Error(
      "Couldn't detect used Storybook framework. Please ensure that you install `@storybook/<framework>` package",
    );

  return framework;
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
