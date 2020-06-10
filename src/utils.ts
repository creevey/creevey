import fs from 'fs';
import path from 'path';
import cluster from 'cluster';
import { SkipOptions, isDefined, WebpackMessage, TestWorkerMessage } from './types';

export const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.es', '.es6'];

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
  meta: {
    browser: string;
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
    return skipOptions.map((skipOption) => shouldSkip(meta, skipOption, test)).find(Boolean) || false;
  }
  const { in: browsers, kinds, stories, tests, reason = true } = skipOptions;
  const { browser, kind, story } = meta;
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

export function emitMessage<T>(message: T): boolean {
  if (cluster.isWorker && !process.connected) return false;
  return (
    process.send?.call(process, message) ??
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // NOTE wrong typings `process.emit` return boolean
    process.emit('message', message)
  );
}

export function subscribeOn(type: 'tests', handler: (message: TestWorkerMessage) => void): void;
export function subscribeOn(type: 'webpack', handler: (message: WebpackMessage) => void): void;
export function subscribeOn(type: 'shutdown', handler: (message: 'shutdown') => void): void;

export function subscribeOn(
  type: 'tests' | 'webpack' | 'shutdown',
  handler:
    | ((message: TestWorkerMessage) => void)
    | ((message: WebpackMessage) => void)
    | ((message: 'shutdown') => void),
): void {
  process.on('message', (message: TestWorkerMessage | WebpackMessage | 'shutdown') => {
    if (type == 'tests' && typeof message == 'object' && 'id' in message)
      return (handler as (message: TestWorkerMessage) => void)(message);
    if (type == 'webpack' && typeof message == 'object' && 'type' in message && typeof message.type == 'string')
      return (handler as (message: WebpackMessage) => void)(message);
    if (type == 'shutdown' && typeof message == 'string' && message == 'shutdown')
      return (handler as (message: 'shutdown') => void)(message);
  });
}

export function shutdownWorkers(): void {
  emitMessage<'shutdown'>('shutdown');
  // NOTE Some workers exit on SIGINT, we need to wait a little to kill the remaining
  setTimeout(() =>
    Object.values(cluster.workers)
      .filter(isDefined)
      .filter((worker) => worker.isConnected())
      .forEach((worker) => {
        const timeout = setTimeout(() => worker.kill(), 10000);
        worker.on('disconnect', () => clearTimeout(timeout));
        worker.send('shutdown');
        worker.disconnect();
      }),
  );
}
