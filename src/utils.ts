import fs from 'fs';
import path from 'path';
import { SkipOptions, isDefined } from './types';

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.es', '.es6'];

const compilers = {
  '@babel/register': () => (hook: Function) => hook({ rootMode: 'upward-optional', extensions }),
  'ts-node': (rootDir: string) => (hook: { register: Function }) => {
    // NOTE `dir` options are supported only from `ts-node@>=8.6`, but default angular project use older version
    hook.register({ project: path.join(rootDir, 'tsconfig.json') });
    // NOTE This need to support tsconfig aliases
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

export function loadCompilers(rootDir: string): void {
  Object.entries(compilers).forEach(([moduleName, register]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      register(rootDir)(require(moduleName));
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
    const childModules = require.cache[__filename].children;
    // NOTE If config load failed then the module of config can't have child modules
    if (childModules.find((child) => child.filename == configPath)?.children.length != 0) {
      throw error;
    }
    const configDir = isDefined(configPath) ? path.parse(configPath).dir : process.cwd();

    loadCompilers(configDir);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const configModule = require(configPath);
  return configModule && configModule.__esModule ? configModule.default : configModule;
}
