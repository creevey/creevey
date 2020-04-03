import fs from 'fs';
import path from 'path';
import { Extension, jsVariants, ExtensionDescriptor, Hook } from 'interpret';
import { SkipOptions, isDefined } from './types';

// NOTE Patch @babel/register hook due issue https://github.com/gulpjs/interpret/issues/61
['.ts', '.tsx'].forEach((patchExtension: string) => {
  const moduleDescriptor = jsVariants[patchExtension];
  if (Array.isArray(moduleDescriptor)) {
    const babelCompiler = moduleDescriptor.find(
      (ext): ext is ExtensionDescriptor => typeof ext == 'object' && ext.module == '@babel/register',
    );
    if (!babelCompiler) return;
    const oldRegister = babelCompiler.register;
    babelCompiler.register = function (hook) {
      oldRegister(((options) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        hook({ ...options, extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.tsx', '.ts'] })) as Hook);
    };
  }
});

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

function loadCompilers(rootDir: string) {
  // load ./babelrc.* or babel.config.*
  // load ./tsconfig.json
  // init extensions
}

function registerCompiler(moduleDescriptor: Extension | null): void {
  if (moduleDescriptor) {
    if (typeof moduleDescriptor === 'string') {
      require(moduleDescriptor);
    } else if (!Array.isArray(moduleDescriptor)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      moduleDescriptor.register(require(moduleDescriptor.module));
    } else {
      moduleDescriptor.find((extension) => {
        try {
          registerCompiler(extension);
          return true;
        } catch (e) {
          // do nothing
        }
      });
    }
  }
}

export function requireConfig<T>(configPath: string): T {
  // const configDir = isDefined(configPath) ? path.parse(configPath).dir : process.cwd();
  // loadCompilers(configDir)

  let ext = path.extname(configPath);
  if (!ext || ext == '.config') {
    ext = Object.keys(jsVariants).find((key) => fs.existsSync(`${configPath}${key}`)) || ext;
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
    registerCompiler(jsVariants[ext]);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const configModule = require(configPath);
  return configModule && configModule.__esModule ? configModule.default : configModule;
}
