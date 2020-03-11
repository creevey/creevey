import { readdirSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { PNG } from 'pngjs';
import { expect } from 'chai';
import { Context } from 'mocha';
import globBase from 'glob-base';
import { makeRe } from 'micromatch';
import chokidar from 'chokidar';
import createChannel from '@storybook/channel-postmessage';
import addons, { DecoratorFunction, StoryFn } from '@storybook/addons';
import { toId, storyNameFromExport, isExportStory } from '@storybook/csf';
import { ClientApi, StoryStore } from '@storybook/client-api';
import Events from '@storybook/core-events';
import { logger } from '@storybook/client-logger';
import { By, WebDriver } from 'selenium-webdriver';
import {
  isDefined,
  Test,
  CreeveyStoryParams,
  StoriesRaw,
  noop,
  SkipOptions,
  isObject,
  isString,
  ServerTest,
  StoryInput,
  Config,
} from './types';
import { shouldSkip, requireConfig } from './utils';

declare global {
  interface Window {
    __CREEVEY_RESTORE_SCROLL__?: () => void;
  }
}

async function hideBrowserScroll(browser: WebDriver): Promise<() => Promise<void>> {
  const HideScrollStyles = `
html {
  overflow: -moz-scrollbars-none !important;
  -ms-overflow-style: none !important;
}
html::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
}
`;

  await browser.executeScript(function(stylesheet: string) {
    /* eslint-disable no-var */
    var style = document.createElement('style');
    var textNode = document.createTextNode(stylesheet);
    style.setAttribute('type', 'text/css');
    style.appendChild(textNode);
    document.head.appendChild(style);

    window.__CREEVEY_RESTORE_SCROLL__ = function() {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      delete window.__CREEVEY_RESTORE_SCROLL__;
    };
    /* eslint-enable no-var */
  }, HideScrollStyles);

  return () =>
    browser.executeScript(function() {
      if (window.__CREEVEY_RESTORE_SCROLL__) {
        window.__CREEVEY_RESTORE_SCROLL__();
      }
    });
}

async function takeCompositeScreenshot(
  browser: WebDriver,
  windowSize: { width: number; height: number },
  elementRect: DOMRect,
): Promise<string> {
  const screens = [];
  const cols = Math.ceil(elementRect.width / windowSize.width);
  const rows = Math.ceil(elementRect.height / windowSize.height);
  const isFitHorizontally = windowSize.width >= elementRect.width + elementRect.left;
  const isFitVertically = windowSize.height >= elementRect.height + elementRect.top;
  const xOffset = Math.round(
    isFitHorizontally ? elementRect.left : Math.max(0, cols * windowSize.width - elementRect.width),
  );
  const yOffset = Math.round(
    isFitVertically ? elementRect.top : Math.max(0, rows * windowSize.height - elementRect.height),
  );

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const dx = Math.min(windowSize.width * col + elementRect.left, Math.max(0, elementRect.right - windowSize.width));
      const dy = Math.min(
        windowSize.height * row + elementRect.top,
        Math.max(0, elementRect.bottom - windowSize.height),
      );
      await browser.executeScript(
        function(x: number, y: number) {
          window.scrollTo(x, y);
        },
        dx,
        dy,
      );
      screens.push(await browser.takeScreenshot());
    }
  }

  const images = screens.map(s => Buffer.from(s, 'base64')).map(b => PNG.sync.read(b));
  const compositeImage = new PNG({ width: Math.round(elementRect.width), height: Math.round(elementRect.height) });

  for (let y = 0; y < compositeImage.height; y += 1) {
    for (let x = 0; x < compositeImage.width; x += 1) {
      const col = Math.floor(x / windowSize.width);
      const row = Math.floor(y / windowSize.height);
      const isLastCol = cols - col == 1;
      const isLastRow = rows - row == 1;
      const i = (y * compositeImage.width + x) * 4;
      const j =
        ((y % windowSize.height) * windowSize.width + (x % windowSize.width)) * 4 +
        (isLastRow ? yOffset * windowSize.width * 4 : 0) +
        (isLastCol ? xOffset * 4 : 0);
      const image = images[row * cols + col];
      compositeImage.data[i + 0] = image.data[j + 0];
      compositeImage.data[i + 1] = image.data[j + 1];
      compositeImage.data[i + 2] = image.data[j + 2];
      compositeImage.data[i + 3] = image.data[j + 3];
    }
  }
  return PNG.sync.write(compositeImage).toString('base64');
}

async function takeScreenshot(browser: WebDriver, captureElement?: string): Promise<string> {
  if (!captureElement) return browser.takeScreenshot();

  const restoreScroll = await hideBrowserScroll(browser);
  const { elementRect, windowSize } = await browser.executeScript(function(selector: string) {
    return {
      elementRect: document.querySelector(selector)?.getBoundingClientRect(),
      windowSize: { width: window.innerWidth, height: window.innerHeight },
    };
  }, captureElement);

  const isFitIntoViewport =
    elementRect.width + elementRect.left <= windowSize.width &&
    elementRect.height + elementRect.top <= windowSize.height;

  const screenshot = await (isFitIntoViewport
    ? browser.findElement(By.css(captureElement)).takeScreenshot()
    : takeCompositeScreenshot(browser, windowSize, elementRect));

  await restoreScroll();

  return screenshot;
}

function storyTestFabric(captureElement?: string) {
  return async function storyTest(this: Context) {
    const screenshot = await takeScreenshot(this.browser, captureElement);
    await expect(screenshot).to.matchImage();
  };
}

function createCreeveyTest(
  meta: {
    browser: string;
    kind: string;
    story: string;
  },
  skipOptions?: SkipOptions,
  testName?: string,
): Test {
  const { browser, kind, story } = meta;
  const path = [browser, testName, story, kind].filter(isDefined);
  const skip = skipOptions ? shouldSkip(meta, skipOptions) : false;
  const id = createHash('sha1')
    .update(path.join('/'))
    .digest('hex');
  return { id, skip, path };
}

export function convertStories(
  browsers: string[],
  stories: StoriesRaw | StoryInput[],
): Partial<{ [testId: string]: ServerTest }> {
  const tests: { [testId: string]: ServerTest } = {};

  (Array.isArray(stories) ? stories : Object.values(stories)).forEach(story => {
    browsers.forEach(browserName => {
      const { captureElement, tests: storyTests, skip }: CreeveyStoryParams = story.parameters.creevey ?? {};
      const meta = { browser: browserName, story: story.name, kind: story.kind };

      // typeof tests === "undefined" => rootSuite -> kindSuite -> storyTest -> [browsers.png]
      // typeof tests === "function"  => rootSuite -> kindSuite -> storyTest -> browser -> [images.png]
      // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
      // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> browser -> [images.png]

      if (!storyTests) {
        const test = createCreeveyTest(meta, skip);
        tests[test.id] = { ...test, story, fn: storyTestFabric(captureElement) };
        return;
      }

      Object.entries(storyTests).forEach(([testName, testFn]) => {
        const test = createCreeveyTest(meta, skip, testName);
        tests[test.id] = { ...test, story, fn: testFn };
      });
    });
  });

  return tests;
}

function initStorybookEnvironment(): void {
  require('jsdom-global/register');

  // NOTE Cutoff `jsdom` part from userAgent, because storybook check enviroment and create events channel if runs in browser
  // https://github.com/storybookjs/storybook/blob/v5.2.8/lib/core/src/client/preview/start.js#L98
  // Example: "Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/15.2.1"
  Object.defineProperty(window.navigator, 'userAgent', {
    value: window.navigator.userAgent.replace(/jsdom\/(\d+\.?)+/, '').trim(),
  });

  // NOTE Disable storybook debug output due issue https://github.com/storybookjs/storybook/issues/8461
  logger.debug = noop;
}

function optimizeStoriesLoading(storybookDir: string): void {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const { wrap } = module.constructor;

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  module.constructor.wrap = function(script: string) {
    return wrap(
      `const shouldSkip = !(${function(storybookDir: string) {
        const { filename: parentFilename } = require.cache[__filename].parent ?? {};

        return (
          __filename.includes(storybookDir) ||
          __filename.includes('@storybook') ||
          __filename.includes('creevey') ||
          parentFilename?.includes('node_modules') ||
          parentFilename?.includes('creevey') ||
          (parentFilename?.includes(storybookDir) && !__filename.includes('node_modules'))
        );
      }.toString()})(${JSON.stringify(storybookDir)});

      if (shouldSkip) return module.exports = (${function() {
        const proxy: Function = new Proxy(
          function() {
            /* noop */
          },
          {
            apply: () => proxy,
            construct: () => proxy,
            get: () => proxy,
          },
        );
        return proxy;
      }.toString()})();

      ${script}`,
    );
  };
}

interface RequireContextArgs {
  path: string;
  recursive: boolean;
  match: RegExp;
}

const isRequireContextArgs = (val: RequireContextArgs | object): val is RequireContextArgs =>
  'path' in val &&
  'recursive' in val &&
  'match' in val &&
  typeof val.path == 'string' &&
  typeof val.recursive == 'boolean' &&
  val.match instanceof RegExp;

function toRequireContext(input: unknown): RequireContextArgs {
  if (typeof input == 'string') {
    // TODO Check if string parsed as glob correctly. call isGlob
    const { base, glob } = globBase(input);

    return { path: base, recursive: glob.startsWith('**'), match: makeRe(glob) };
  }
  if (isObject(input) && isRequireContextArgs(input)) return input;

  throw new Error('the provided input cannot be transformed into a require.context');
}

declare global {
  interface Window {
    __STORYBOOK_CLIENT_API__: ClientApi | undefined;
    __STORYBOOK_STORY_STORE__: StoryStore | undefined;
  }
}
function getStorybookApi(): { clientApi: ClientApi; storyStore: StoryStore } | undefined {
  if (
    typeof window.__STORYBOOK_CLIENT_API__ !== 'undefined' &&
    typeof window.__STORYBOOK_STORY_STORE__ !== 'undefined'
  ) {
    return { clientApi: window.__STORYBOOK_CLIENT_API__, storyStore: window.__STORYBOOK_STORY_STORE__ };
  }
}

function loadStoriesFromFile(fileName: string, clientApi: ClientApi): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fileExports = require(fileName);

  // NOTE Copy some stories initialization logic from https://github.com/storybookjs/storybook/blob/v5.3.14/lib/core/src/client/preview/start.js
  // NOTE An old-style story file
  if (!fileExports.default) return;
  if (!fileExports.default.title)
    return console.log(
      `Unexpected default export from '${fileName}' without title: ${JSON.stringify(fileExports.default)}`,
    );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { default: meta, __namedExportsOrder, ...namedExports } = fileExports;

  const {
    title: kindName,
    id: componentId,
    parameters: params,
    decorators: decos = [],
    component,
    subcomponents,
  } = meta;
  // We pass true here to avoid the warning about HMR. It's cool clientApi, we got this
  const kind = clientApi.storiesOf(kindName, true as never);

  // NOTE In Creevey we don't have framework variable, so should be unknown
  kind.addParameters({
    framework: 'unknown',
    component,
    subcomponents,
    fileName,
    ...params,
  });

  decos.forEach((decorator: DecoratorFunction) => kind.addDecorator(decorator));

  // TODO Improve typings
  Object.entries(
    namedExports as {
      [exportName: string]: StoryFn & { story?: { name?: string; parameters?: {}; decorators?: DecoratorFunction[] } };
    },
  ).forEach(([exportName, storyFn]) => {
    if (isExportStory(exportName, meta)) {
      const storyName = storyNameFromExport(exportName);
      const { name = storyName, parameters, decorators } = storyFn?.story ?? {};
      const decoratorParams = decorators ? { decorators } : null;

      kind.add(name, storyFn, {
        ...parameters,
        ...decoratorParams,
        __id: toId(componentId || kindName, storyName),
      });
    }
  });
}

function mapKindsToFiles(stories: StoriesRaw): Map<string, Set<string>> {
  return Object.values(stories).reduce(
    (kinds, { kind, parameters: { fileName } }) => kinds.set(fileName, (kinds.get(fileName) ?? new Set()).add(kind)),
    new Map<string, Set<string>>(),
  );
}

function removeOldStories(filename: string, storyStore: StoryStore, kinds?: Set<string>): void {
  delete require.cache[filename];

  if (!kinds || kinds.size == 0) return;
  // NOTE If user has more than one file with same kind. And one that file has been changed, we remove all stories on that kind
  kinds.forEach(kind => storyStore.removeStoryKind(kind));
  storyStore.incrementRevision();
}

function watchStories(storybookDir: string, stories: StoriesRaw, filesOrBlobs: string[]): void {
  const { clientApi, storyStore } = getStorybookApi() ?? {};
  if (!clientApi || !storyStore) {
    console.log(
      `[Creevey:${process.pid}]:`,
      `Can't get Storybook client API. Hot reload for stories are not working, please check your storybook config files`,
    );
    return;
  }

  let storiesByFiles: Map<string, StoryInput[]> = new Map();
  let kindsByFiles = mapKindsToFiles(stories);

  // NOTE Update kinds after file with stories was changed
  addons.getChannel().on(Events.SET_STORIES, (data: { stories: StoriesRaw }) => {
    kindsByFiles = mapKindsToFiles(data.stories);

    Object.values(data.stories).forEach(story => storiesByFiles.get(story.parameters.fileName)?.push(story));
    addons.getChannel().emit('storiesUpdated', storiesByFiles);
    storiesByFiles = new Map();
  });

  // NOTE We don't support RequireContextArgs objects to pass it into chokidar
  const watcher = chokidar.watch(filesOrBlobs, { ignoreInitial: true, cwd: storybookDir });

  watcher.on('all', (event, filename) => {
    const absoluteFilePath = path.resolve(storybookDir, filename);
    if (event == 'addDir' || event == 'unlinkDir') return;

    storiesByFiles.set(absoluteFilePath, []);

    if (event != 'add') removeOldStories(absoluteFilePath, storyStore, kindsByFiles.get(absoluteFilePath));
    if (event != 'unlink') loadStoriesFromFile(absoluteFilePath, clientApi);
  });
}

function loadOldStorybookConfig(storybookDir: string): void {
  addons.getChannel().once(Events.SET_STORIES, (data: { stories: StoriesRaw }) => {
    // NOTE Known limitations, we can't get basePath and regex from require.context call inside `configure`,
    // so we have only certain list of files according by stories.
    // If user add new file with stories, that file can't be loaded
    watchStories(
      storybookDir,
      data.stories,
      Array.from(new Set(Object.values(data.stories).map(story => story.parameters.fileName))),
    );
  });
  requireConfig(path.join(storybookDir, 'config'));
}

function loadNewStorybookConfigs(storybookDir: string): void {
  requireConfig(path.join(storybookDir, 'preview'));

  const { clientApi } = getStorybookApi() ?? {};
  if (!clientApi)
    return console.log(
      `[Creevey:${process.pid}]:`,
      `Can't get Storybook client API. Hot reload for stories are not working, please check your storybook config files`,
    );

  const { stories = [] }: { stories?: unknown[] } = requireConfig(path.join(storybookDir, 'main'));

  addons.getChannel().once(Events.SET_STORIES, (data: { stories: StoriesRaw }) => {
    if (!stories.every(isString))
      console.log(
        "Your stories array defined in 'main' config files contain non-string entities. Creevey can watch files only by glob patterns",
      );

    watchStories(storybookDir, data.stories, stories.filter(isString));
  });

  stories
    .map(toRequireContext)
    .map(({ path: basePath, recursive, match }) =>
      require.context(path.resolve(storybookDir, basePath), recursive, match),
    )
    .forEach(req => req.keys().forEach(filename => loadStoriesFromFile(filename, clientApi)));
}

export function loadStorybookConfig(
  storybookDir: string,
  enableFastStoriesLoading: boolean,
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
): Promise<StoriesRaw> {
  return new Promise(resolve => {
    initStorybookEnvironment();

    const channel = createChannel({ page: 'preview' });
    channel.once(Events.SET_STORIES, (data: { stories: StoriesRaw }) => resolve(data.stories));
    channel.on('storiesUpdated', (storiesByFiles: Map<string, StoryInput[]>) => storiesListener(storiesByFiles));
    addons.setChannel(channel);

    // TODO Check if need reset optimization
    if (enableFastStoriesLoading) optimizeStoriesLoading(storybookDir);

    const storybookFiles = readdirSync(storybookDir);
    const hasOldConfig = Boolean(storybookFiles.find(filename => filename.startsWith('config')));
    const hasNewConfig = Boolean(storybookFiles.find(filename => filename.startsWith('main')));

    if (hasOldConfig && hasNewConfig)
      throw new Error("You can't use both old and new storybook configs in the same time");
    if (!hasOldConfig && !hasNewConfig)
      throw new Error(`We can't find any of supported storybook configs in '${storybookDir}' directory`);

    if (hasNewConfig) loadNewStorybookConfigs(storybookDir);
    if (hasOldConfig) loadOldStorybookConfig(storybookDir);
  });
}

export async function loadTestsFromStories(
  config: Config,
  browsers: string[],
  applyTestsDiff: (testsDiff: Partial<{ [id: string]: ServerTest }>) => void,
): Promise<Partial<{ [id: string]: ServerTest }>> {
  const testIdsByFiles: Map<string, string[]> = new Map();
  const stories = await loadStorybookConfig(config.storybookDir, config.enableFastStoriesLoading, storiesByFiles => {
    const testsDiff: Partial<{ [id: string]: ServerTest }> = {};
    Array.from(storiesByFiles.entries()).forEach(([filename, stories]) => {
      const tests = convertStories(browsers, stories);
      const changed = Object.keys(tests);
      const removed = testIdsByFiles.get(filename)?.filter(testId => !tests[testId]) ?? [];
      if (changed.length == 0) testIdsByFiles.delete(filename);
      else testIdsByFiles.set(filename, changed);

      Object.assign(testsDiff, tests);
      removed.forEach(testId => (testsDiff[testId] = undefined));
    });
    applyTestsDiff(testsDiff);
  });

  const tests = convertStories(browsers, stories);

  Object.values(tests)
    .filter(isDefined)
    .forEach(({ id, story: { parameters: { fileName } } }) =>
      testIdsByFiles.set(fileName, [...(testIdsByFiles.get(fileName) ?? []), id]),
    );

  return tests;
}
