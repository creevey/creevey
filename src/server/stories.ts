import path from 'path';
import { createHash } from 'crypto';
import { Context } from 'mocha';
import chokidar from 'chokidar';
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
} from '../types';
import { shouldSkip, isStorybookVersionLessThan, getCreeveyCache } from './utils';
import { mergeWith } from 'lodash';
import { subscribeOn } from './messages';

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
  require('jsdom-global')(undefined, { url: 'http://localhost' });

  // NOTE Cutoff `jsdom` part from userAgent, because storybook check enviroment and create events channel if runs in browser
  // https://github.com/storybookjs/storybook/blob/v5.2.8/lib/core/src/client/preview/start.js#L98
  // Example: "Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/15.2.1"
  Object.defineProperty(window.navigator, 'userAgent', {
    value: window.navigator.userAgent.replace(/jsdom\/(\d+\.?)+/, '').trim(),
  });

  if (isStorybookVersionLessThan(6)) {
    // NOTE: disable logger for 5.x storybook
    ((await import(require.resolve('@storybook/client-logger', { paths: [process.cwd()] }))) as {
      logger: { debug: unknown };
    }).logger.debug = noop;
  }

  return import('./storybook');
}

function watchStories(initialFiles: Set<string>): void {
  const watchingFiles = initialFiles;
  let storiesByFiles = new Map<string, StoryInput[]>();

  const watcher = chokidar.watch(Array.from(watchingFiles), { ignoreInitial: true });

  subscribeOn('shutdown', () => void watcher.close());

  watcher.on('change', (filePath) => storiesByFiles.set(`./${filePath.replace(/\\/g, '/')}`, []));
  watcher.on('unlink', (filePath) => storiesByFiles.set(`./${filePath.replace(/\\/g, '/')}`, []));

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
    watcher.unwatch(removedFiles);
    removedFiles.forEach((filePath) => watchingFiles.delete(filePath));

    Object.values(stories).forEach((story) => storiesByFiles.get(story.parameters.fileName)?.push(story));
    addons.getChannel().emit('storiesUpdated', storiesByFiles);
    storiesByFiles = new Map<string, StoryInput[]>();
  });
}

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

async function loadStorybookBundle(
  watch: boolean,
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
): Promise<StoriesRaw> {
  const bundlePath = path.join(getCreeveyCache(), 'storybook/main.js');

  const { channel } = await initStorybookEnvironment();
  channel.removeAllListeners(Events.CURRENT_STORY_WAS_SET);

  channel.on('storiesUpdated', storiesListener);

  if (watch) {
    subscribeOn('webpack', (message: WebpackMessage) => {
      if (message.type != 'rebuild succeeded') return;

      Object.values(global.__CREEVEY_HMR_DATA__)
        .filter(({ callback }) => callback)
        .forEach(({ data, callback }) => callback(data));

      delete require.cache[bundlePath];
      require(bundlePath);
    });
  }

  return new Promise((resolve) => {
    channel.once(Events.SET_STORIES, (data: SetStoriesData) => {
      const stories = isStorybookVersionLessThan(6) ? data.stories : flatStories(data);
      if (watch) {
        watchStories(new Set(Object.values(stories).map((story) => story.parameters.fileName)));
      }
      resolve(stories);
    });

    require(bundlePath);
  });
}

export async function loadTestsFromStories(
  { browsers, watch }: { browsers: string[]; watch: boolean },
  applyTestsDiff: (testsDiff: Partial<{ [id: string]: ServerTest }>) => void,
): Promise<Partial<{ [id: string]: ServerTest }>> {
  const testIdsByFiles = new Map<string, string[]>();
  const stories = await loadStorybookBundle(watch, (storiesByFiles) => {
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
    applyTestsDiff(testsDiff);
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
