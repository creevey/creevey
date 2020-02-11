import https from 'https';
import fs, { Dirent } from 'fs';
import path from 'path';
import { Context, Test, Suite } from 'mocha';
import { Builder, By, until, WebDriver, Origin } from 'selenium-webdriver';
import { Extension, jsVariants, ExtensionDescriptor, Hook } from 'interpret';
import { toId } from '@storybook/router';
import { Config, BrowserConfig, SkipOptions, isDefined } from './types';

type PlatformFS = typeof fs;
type PlatformPath = typeof path;

const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/;

// NOTE Patch @babel/register hook due issue https://github.com/gulpjs/interpret/issues/61
['.ts', '.tsx'].forEach((patchExtension: string) => {
  const moduleDescriptor = jsVariants[patchExtension];
  if (Array.isArray(moduleDescriptor)) {
    const babelCompiler = moduleDescriptor.find(
      (ext): ext is ExtensionDescriptor => typeof ext == 'object' && ext.module == '@babel/register',
    );
    if (!babelCompiler) return;
    const oldRegister = babelCompiler.register;
    babelCompiler.register = function(hook) {
      oldRegister((options =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        hook({ ...options, extensions: ['.ts', '.tsx'] })) as Hook);
    };
  }
});

function getRealIp(): Promise<string> {
  return new Promise((resolve, reject) =>
    https.get('https://fake.testkontur.ru/ip', res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Couldn't resolve real ip for \`localhost\`. Status code: ${res.statusCode}`));
      }

      let data = '';

      res.setEncoding('utf8');
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    }),
  );
}

async function resetMousePosition(browser: WebDriver): Promise<void> {
  const isChrome = (await browser.getCapabilities()).get('browserName') == 'chrome';
  const { top, left, width, height } = await browser.executeScript(function() {
    /* eslint-disable no-var */
    // NOTE On storybook >= 4.x already reset scroll
    window.scrollTo(0, 0);

    var bodyRect = document.body.getBoundingClientRect();
    return {
      top: bodyRect.top,
      left: bodyRect.left,
      width: bodyRect.width,
      height: bodyRect.height,
    };
    /* eslint-enable no-var */
  });

  if (isChrome) {
    // NOTE Bridge mode not support move mouse relative viewport
    await browser
      .actions({ bridge: true })
      .move({
        origin: browser.findElement(By.css('body')),
        x: Math.ceil((-1 * width) / 2) - left,
        y: Math.ceil((-1 * height) / 2) - top,
      })
      .perform();
  } else {
    // NOTE Firefox for some reason moving by 0 x 0 move cursor in bottom left corner :sad:
    // NOTE IE don't emit move events until force window focus or connect by RDP on virtual machine
    await browser
      .actions()
      .move({ origin: Origin.VIEWPORT, x: 0, y: 1 })
      .perform();
  }
}

async function resizeViewport(browser: WebDriver, viewport: { width: number; height: number }): Promise<void> {
  const windowRect = await browser
    .manage()
    .window()
    .getRect();
  const { innerWidth, innerHeight } = await browser.executeScript(function() {
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });
  const dWidth = windowRect.width - innerWidth;
  const dHeight = windowRect.height - innerHeight;
  await browser
    .manage()
    .window()
    .setRect({
      width: viewport.width + dWidth,
      height: viewport.height + dHeight,
    });
}

function selectStory(browser: WebDriver, kind: string, story: string): Promise<void> {
  return browser.executeAsyncScript(
    function(storyId: string, kind: string, name: string, callback: Function) {
      window.__CREEVEY_SELECT_STORY__(storyId, kind, name, callback);
    },
    toId(kind, story),
    kind,
    story,
  );
}

function disableAnimations(browser: WebDriver): Promise<void> {
  const disableAnimationsStyles = `
*,
*:hover,
*::before,
*::after {
  animation-delay: -0.0001ms !important;
  animation-duration: 0s !important;
  animation-play-state: paused !important;
  cursor: none !important;
  caret-color: transparent !important;
  transition: 0s !important;
}
`;
  return browser.executeScript(function(stylesheet: string) {
    /* eslint-disable no-var */
    var style = document.createElement('style');
    var textnode = document.createTextNode(stylesheet);
    style.setAttribute('type', 'text/css');
    style.appendChild(textnode);
    document.head.appendChild(style);
    /* eslint-enable no-var */
  }, disableAnimationsStyles);
}

export async function getBrowser(config: Config, browserConfig: BrowserConfig): Promise<WebDriver> {
  const {
    gridUrl = config.gridUrl,
    storybookUrl: address = config.storybookUrl,
    limit,
    testRegex,
    viewport,
    ...capabilities
  } = browserConfig;
  void limit;
  void testRegex;
  let realAddress = address;
  if (LOCALHOST_REGEXP.test(address)) {
    realAddress = address.replace(LOCALHOST_REGEXP, await getRealIp());
  }
  const browser = await new Builder()
    .usingServer(gridUrl)
    .withCapabilities(capabilities)
    .build();

  if (viewport) {
    await resizeViewport(browser, viewport);
  }
  try {
    await browser.get(`${realAddress}/iframe.html`);
    await browser.wait(until.elementLocated(By.css('#root')), 10000);
  } catch (_) {
    throw new Error(`Cann't load storybook root page by URL ${realAddress}/iframe.html`);
  }
  await disableAnimations(browser);

  return browser;
}

export async function switchStory(this: Context): Promise<void> {
  let testOrSuite: Test | Suite | undefined = this.currentTest;

  this.testScope.length = 0;
  this.testScope.push(this.browserName);
  while (testOrSuite && testOrSuite.title) {
    this.testScope.push(testOrSuite.title);
    testOrSuite = testOrSuite.parent;
  }
  // `kindSuite -> storySuite -> test`
  // `kindSuite -> storyTest`
  // TODO If story or kind is undefined should throw error
  const [, test] = this.testScope;
  let [, , story, kind] = this.testScope;

  if (!kind) {
    kind = story;
    story = test;
  }

  await resetMousePosition(this.browser);
  await selectStory(this.browser, kind, story);

  this.testScope.reverse();
}

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
    test?: string;
  },
  skipOptions: SkipOptions,
): string | boolean {
  if (typeof skipOptions == 'string') {
    return skipOptions;
  }
  if (Array.isArray(skipOptions)) {
    return skipOptions.map(skipOption => shouldSkip(meta, skipOption)).find(Boolean) || false;
  }
  const { in: browsers, kinds, stories, tests, reason = true } = skipOptions;
  const { browser, kind, story, test } = meta;
  const skipByBrowser = matchBy(browsers, browser);
  const skipByKind = matchBy(kinds, kind);
  const skipByStory = matchBy(stories, story);
  const skipByTest = !isDefined(test) || matchBy(tests, test);

  return skipByBrowser && skipByKind && skipByStory && skipByTest && reason;
}

export function registerRequireContext(): void {
  function requireContext(rootPath: string, deep?: boolean, filter?: RegExp): __WebpackModuleApi.RequireContext {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs: PlatformFS = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path: PlatformPath = require('path');

    const ids: string[] = [];
    let contextPath: string;
    // Relative path
    if (rootPath.startsWith('.')) contextPath = path.join(__dirname, rootPath);
    // Module path
    else if (!path.isAbsolute(rootPath)) contextPath = require.resolve(rootPath);
    // Absolute path
    else contextPath = rootPath;
    const traverse = (dirPath: string): void => {
      fs.readdirSync(dirPath, { withFileTypes: true }).forEach((dirent: Dirent) => {
        const filename = dirent.name;

        if (dirent.isDirectory() && deep) return traverse(path.join(dirPath, filename));
        if (dirent.isFile() && (filter?.test(filename) ?? true)) return ids.push(path.join(dirPath, filename));
      });
    };

    traverse(contextPath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = (id: string): any => require(id);
    context.id = contextPath;
    context.keys = () => ids;
    context.resolve = (id: string) => id;

    return context;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const { wrap } = module.constructor;

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  module.constructor.wrap = function(script: string) {
    return wrap(
      `require.context = ${requireContext.toString()};
      ${script}`,
    );
  };
}

function registerCompiler(moduleDescriptor: Extension | null): void {
  if (moduleDescriptor) {
    if (typeof moduleDescriptor === 'string') {
      require(moduleDescriptor);
    } else if (!Array.isArray(moduleDescriptor)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      moduleDescriptor.register(require(moduleDescriptor.module));
    } else {
      moduleDescriptor.find(extension => {
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
  let ext = path.extname(configPath);
  if (!ext || ext == '.config') {
    ext = Object.keys(jsVariants).find(key => fs.existsSync(`${configPath}${key}`)) || ext;
    configPath += ext;
  }
  try {
    require(configPath);
  } catch (error) {
    const childModules = require.cache[__filename].children;
    // NOTE If config load failed then the module of config can't have child modules
    if (childModules.find(child => child.filename == configPath)?.children.length != 0) {
      throw error;
    }
    registerCompiler(jsVariants[ext]);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const configModule = require(configPath);
  return configModule && configModule.__esModule ? configModule.default : configModule;
}
