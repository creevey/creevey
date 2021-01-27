import path from 'path';
import chokidar from 'chokidar';
import cluster from 'cluster';
import addons from '@storybook/addons';
import Events from '@storybook/core-events';
import {
  isDefined,
  StoriesRaw,
  noop,
  ServerTest,
  StoryInput,
  WebpackMessage,
  SetStoriesData,
  StoriesProvider,
  StoriesProviderFactory,
  isWebpackMessage,
} from '../../types';
import { isStorybookVersionLessThan, getCreeveyCache } from '../utils';
import { mergeWith } from 'lodash';
import { emitWebpackMessage, subscribeOn } from '../messages';
import { convertStoriesToTests } from './convertStoriesToTests';

async function initStorybookEnvironment(): Promise<typeof import('../storybook')> {
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

  return import('../storybook');
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

async function loadTestsFromStories(
  { browsers, watch }: { browsers: string[]; watch: boolean },
  applyTestsDiff: (testsDiff: Partial<{ [id: string]: ServerTest }>) => void,
): Promise<Partial<{ [id: string]: ServerTest }>> {
  const testIdsByFiles = new Map<string, string[]>();
  const stories = await loadStorybookBundle(watch, (storiesByFiles) => {
    const testsDiff: Partial<{ [id: string]: ServerTest }> = {};
    Array.from(storiesByFiles.entries()).forEach(([filename, stories]) => {
      const tests = convertStoriesToTests(browsers, stories);
      const changed = Object.keys(tests);
      const removed = testIdsByFiles.get(filename)?.filter((testId) => !tests[testId]) ?? [];
      if (changed.length == 0) testIdsByFiles.delete(filename);
      else testIdsByFiles.set(filename, changed);

      Object.assign(testsDiff, tests);
      removed.forEach((testId) => (testsDiff[testId] = undefined));
    });
    applyTestsDiff(testsDiff);
  });

  const tests = convertStoriesToTests(browsers, stories);

  Object.values(tests)
    .filter(isDefined)
    .forEach(({ id, story: { parameters: { fileName } } }) =>
      // TODO Don't use filename as a key, due possible collisions if two require.context with same structure of modules are defined
      testIdsByFiles.set(fileName, [...(testIdsByFiles.get(fileName) ?? []), id]),
    );

  return tests;
}

function startWebpackCompiler(): Promise<void> {
  return new Promise((resolve, reject) => {
    cluster.setupMaster({ args: ['--webpack', ...process.argv.slice(2)] });
    const webpackCompiler = cluster.fork({ NODE_ENV: 'test' });

    webpackCompiler.on('message', (message: unknown) => {
      if (!isWebpackMessage(message)) return;

      Object.values(cluster.workers)
        .filter((worker) => worker != webpackCompiler)
        .forEach((worker) => worker?.send(message));
      switch (message.type) {
        case 'success':
          return resolve();
        case 'fail':
          return reject();
        case 'rebuild succeeded':
        case 'rebuild failed':
          return emitWebpackMessage(message);
      }
    });
  });
}

export const intergratedStorybookStoriesProvider: StoriesProvider = {
  loadTestsFromStories,
  async init() {
    await startWebpackCompiler();
  },
};

export const createIntegratedStorybookStoriesProvider: StoriesProviderFactory = () =>
  intergratedStorybookStoriesProvider;
