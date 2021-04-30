import path from 'path';
import { isWorker, isMaster } from 'cluster';
import { createHash } from 'crypto';
import { Context } from 'mocha';
import chokidar, { FSWatcher } from 'chokidar';
import addons from '@storybook/addons';
import Events from '@storybook/core-events';
import {
  isDefined,
  TestData,
  CreeveyStoryParams,
  StoriesRaw,
  noop,
  SkipOptions,
  ServerTest,
  StoryInput,
  WebpackMessage,
  CreeveyTestFunction,
  SetStoriesData,
  Config,
} from '../types';
import { shouldSkip, isStorybookVersionLessThan, getCreeveyCache } from './utils';
import { mergeWith } from 'lodash';
import { subscribeOn } from './messages';
import { Parameters } from '@storybook/api';

export let storybookApi: null | typeof import('./storybook') = null;

function storyTestFabric(delay?: number, testFn?: CreeveyTestFunction) {
  return async function storyTest(this: Context) {
    delay ? await new Promise((resolve) => setTimeout(resolve, delay)) : void 0;
    await (testFn?.call(this) ?? this.expect(await this.takeScreenshot()).to.matchImage());
  };
}

function createCreeveyTest(
  browser: string,
  storyMeta: StoryInput,
  skipOptions?: SkipOptions,
  testName?: string,
): TestData {
  const { kind, name: story, id: storyId } = storyMeta;
  const path = [kind, story, testName, browser].filter(isDefined);
  const skip = skipOptions ? shouldSkip(browser, { kind, story }, skipOptions, testName) : false;
  const id = createHash('sha1').update(path.join('/')).digest('hex');
  return { id, skip, browser, testName, storyPath: [...kind.split('/').map((x) => x.trim()), story], storyId };
}

function convertStories(
  browsers: string[],
  stories: StoriesRaw | StoryInput[],
): Partial<{ [testId: string]: ServerTest }> {
  const tests: { [testId: string]: ServerTest } = {};

  (Array.isArray(stories) ? stories : Object.values(stories)).forEach((storyMeta) => {
    browsers.forEach((browserName) => {
      const { delay, tests: storyTests, skip } = (storyMeta.parameters.creevey ?? {}) as CreeveyStoryParams;

      // typeof tests === "undefined" => rootSuite -> kindSuite -> storyTest -> [browsers.png]
      // typeof tests === "function"  => rootSuite -> kindSuite -> storyTest -> browser -> [images.png]
      // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
      // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> browser -> [images.png]

      if (!storyTests) {
        const test = createCreeveyTest(browserName, storyMeta, skip);
        tests[test.id] = { ...test, storyId: storyMeta.id, story: storyMeta, fn: storyTestFabric(delay) };
        return;
      }

      Object.entries(storyTests).forEach(([testName, testFn]) => {
        const test = createCreeveyTest(browserName, storyMeta, skip, testName);
        tests[test.id] = { ...test, storyId: storyMeta.id, story: storyMeta, fn: storyTestFabric(delay, testFn) };
      });
    });
  });

  return tests;
}

async function initStorybookEnvironment(): Promise<typeof import('./storybook')> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  (await import('jsdom-global')).default(undefined, { url: 'http://localhost' });

  // NOTE Cutoff `jsdom` part from userAgent, because storybook check enviroment and create events channel if runs in browser
  // https://github.com/storybookjs/storybook/blob/v5.2.8/lib/core/src/client/preview/start.js#L98
  // Example: "Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/15.2.1"
  Object.defineProperty(window.navigator, 'userAgent', {
    value: window.navigator.userAgent
      .split(' ')
      .filter((token) => !token.startsWith('jsdom'))
      .join(' '),
  });

  const { logger } = (await import('@storybook/client-logger')) as { logger: { debug: unknown; warn: unknown } };
  // NOTE: Disable duplication warnings for >=6.2 storybook
  if (isWorker) logger.warn = noop;
  // NOTE: disable logger for 5.x storybook
  logger.debug = noop;

  return import('./storybook');
}

function watchStories(watcher: FSWatcher, initialFiles: Set<string>): void {
  const watchingFiles = initialFiles;
  let storiesByFiles = new Map<string, StoryInput[]>();

  subscribeOn('shutdown', () => void watcher.close());

  watcher.add(Array.from(watchingFiles));
  watcher.on('change', (filePath) =>
    storiesByFiles.set(path.isAbsolute(filePath) ? filePath : `./${filePath.replace(/\\/g, '/')}`, []),
  );
  watcher.on('unlink', (filePath) =>
    storiesByFiles.set(path.isAbsolute(filePath) ? filePath : `./${filePath.replace(/\\/g, '/')}`, []),
  );

  addons.getChannel().on(Events.SET_STORIES, (data: SetStoriesData) => {
    const stories = isStorybookVersionLessThan(6) ? data.stories : flatStories(data);
    const files = new Set(Object.values(stories).map((story) => story.parameters.fileName));
    const addedFiles = Array.from(files).filter((filePath) => !watchingFiles.has(filePath));
    const removedFiles = Array.from(watchingFiles).filter((filePath) => !files.has(filePath));
    watcher.add(addedFiles);
    addedFiles.forEach((filePath) => {
      watchingFiles.add(filePath);
      storiesByFiles.set(filePath, []);
    });
    removedFiles.forEach((filePath) => watchingFiles.delete(filePath));

    Object.values(stories).forEach((story) => storiesByFiles.get(story.parameters.fileName)?.push(story));
    addons.getChannel().emit('storiesUpdated', storiesByFiles);
    storiesByFiles = new Map<string, StoryInput[]>();
  });
}

// TODO use the storybook version, after the fix of skip option API
function flatStories({ globalParameters, kindParameters, stories }: SetStoriesData): StoriesRaw {
  Object.values(stories).forEach((story) => {
    // NOTE: Copy-paste merge parameters from storybook
    story.parameters = mergeWith(
      {},
      globalParameters,
      kindParameters[story.kind],
      story.parameters,
      (objValue: unknown, srcValue: unknown) => (Array.isArray(objValue) ? objValue.concat(srcValue) : undefined),
    );
  });

  return stories;
}

function loadStoriesFromBundle(watch: boolean): void {
  const bundlePath = path.join(getCreeveyCache(), 'storybook/main.js');

  if (watch) {
    subscribeOn('webpack', (message: WebpackMessage) => {
      if (message.type != 'rebuild succeeded') return;

      Object.values(global.__CREEVEY_HMR_DATA__)
        .filter(({ callback }) => callback)
        .forEach(({ data, callback }) => callback(data));

      delete require.cache[bundlePath];
      import(bundlePath);
    });
  }

  import(bundlePath);
}

async function loadStoriesDirectly(
  config: Config,
  { watcher, debug }: { watcher: FSWatcher | null; debug: boolean },
): Promise<void> {
  const { toRequireContext } = await import('@storybook/core-common');
  const { addParameters, configure } = await import('./storybook');
  const preview = (() => {
    try {
      return require.resolve(`${config.storybookDir}/preview`);
    } catch (_) {
      /* noop */
    }
  })();

  const requireContext = await (await import('./loaders/babel/register')).default(config, debug);
  const { stories } = ((await import(require.resolve(`${config.storybookDir}/main`))) as {
    default: {
      stories: string[];
    };
  }).default;
  const contexts = stories.map((input) => {
    const { path: storiesPath, recursive, match } = toRequireContext(input) as {
      path: string;
      recursive: boolean;
      match: string;
    };
    watcher?.add(path.resolve(config.storybookDir, storiesPath));
    return () => requireContext(storiesPath, recursive, new RegExp(match));
  });

  let disposeCallback = (data: unknown): void => void data;

  Object.assign(module, {
    hot: {
      data: {},
      accept(): void {
        /* noop */
      },
      dispose(callback: (data: unknown) => void): void {
        disposeCallback = callback;
      },
    },
  });

  async function startStorybook(): Promise<void> {
    if (preview) {
      const { parameters, globals, globalTypes } = (await import(preview)) as {
        parameters?: Parameters;
        globals?: unknown;
        globalTypes?: unknown;
      };
      if (parameters) addParameters(parameters);
      if (globals) addParameters({ globals });
      if (globalTypes) addParameters({ globalTypes });
    }
    try {
      configure(
        contexts.map((ctx) => ctx()),
        module,
        false,
      );
    } catch (error) {
      if (isMaster) console.log(error);
    }
  }

  watcher?.add(config.storybookDir);
  watcher?.on('all', (_event, filename) => {
    delete require.cache[filename];
    disposeCallback(module.hot?.data);
    void startStorybook();
  });

  void startStorybook();
}

async function loadStorybook(
  config: Config,
  { watch, debug }: { watch: boolean; debug: boolean },
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
): Promise<StoriesRaw> {
  storybookApi = await initStorybookEnvironment();

  const { channel } = storybookApi;
  channel.removeAllListeners(Events.CURRENT_STORY_WAS_SET);
  channel.on('storiesUpdated', storiesListener);

  let watcher: FSWatcher | null = null;
  if (watch) watcher = chokidar.watch([], { ignoreInitial: true });

  const loadPromise = new Promise<StoriesRaw>((resolve) => {
    channel.once(Events.SET_STORIES, (data: SetStoriesData) => {
      const stories = isStorybookVersionLessThan(6) ? data.stories : flatStories(data);
      const files = new Set(Object.values(stories).map((story) => story.parameters.fileName));

      if (watcher) watchStories(watcher, files);

      resolve(stories);
    });
  });

  if (config.useWebpackToExtractTests) loadStoriesFromBundle(watch);
  else void loadStoriesDirectly(config, { watcher, debug });

  return loadPromise;
}

export async function loadTestsFromStories(
  config: Config,
  browsers: string[],
  {
    watch = false,
    debug = false,
    update,
  }: { watch?: boolean; debug?: boolean; update?: (testsDiff: Partial<{ [id: string]: ServerTest }>) => void },
): Promise<Partial<{ [id: string]: ServerTest }>> {
  const testIdsByFiles = new Map<string, string[]>();
  const stories = await loadStorybook(config, { debug, watch }, (storiesByFiles) => {
    const testsDiff: Partial<{ [id: string]: ServerTest }> = {};
    Array.from(storiesByFiles.entries()).forEach(([filename, stories]) => {
      const tests = convertStories(browsers, stories);
      const changed = Object.keys(tests);
      const removed = testIdsByFiles.get(filename)?.filter((testId) => !tests[testId]) ?? [];
      if (changed.length == 0) testIdsByFiles.delete(filename);
      else testIdsByFiles.set(filename, changed);

      Object.assign(testsDiff, tests);
      removed.forEach((testId) => (testsDiff[testId] = undefined));
    });
    update?.(testsDiff);
  });

  const tests = convertStories(browsers, stories);

  Object.values(tests)
    .filter(isDefined)
    .forEach(({ id, story: { parameters: { fileName } } }) =>
      // TODO Don't use filename as a key, due possible collisions if two require.context with same structure of modules are defined
      testIdsByFiles.set(fileName, [...(testIdsByFiles.get(fileName) ?? []), id]),
    );

  return tests;
}
