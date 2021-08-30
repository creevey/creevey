import path from 'path';
import { isWorker, isMaster } from 'cluster';
import chokidar, { FSWatcher } from 'chokidar';
import type { StoryInput, WebpackMessage, SetStoriesData, Config } from '../../types';
import { noop } from '../../types';
import { getCreeveyCache } from '../utils';
import { subscribeOn } from '../messages';
import type { Parameters } from '@storybook/api';
import type { default as Channel } from '@storybook/channels';
import {
  importStorybookClientLogger,
  importStorybookConfig,
  importStorybookCoreCommon,
  importStorybookCoreEvents,
  isStorybookVersionLessThan,
} from './helpers';
import { logger } from '../logger';
import { flatStories } from '../stories';

async function initStorybookEnvironment(): Promise<typeof import('./entry')> {
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

  // TODO Look at creevey debug flag
  const { logger } = await importStorybookClientLogger();
  // NOTE: Disable duplication warnings for >=6.2 storybook
  if (isWorker) (logger.warn as unknown) = noop;
  // NOTE: disable logger for 5.x storybook
  (logger.debug as unknown) = noop;

  return import('./entry');
}

function watchStories(channel: Channel, watcher: FSWatcher, initialFiles: Set<string>): (data: SetStoriesData) => void {
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

  return (data: SetStoriesData) => {
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
    channel.emit('storiesUpdated', storiesByFiles);
    storiesByFiles = new Map<string, StoryInput[]>();
  };
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
  const { toRequireContext } = await importStorybookCoreCommon();
  const { addParameters, configure } = await import('./entry');
  const requireContext = await (await import('../loaders/babel/register')).default(config, debug);
  const preview = (() => {
    try {
      return require.resolve(`${config.storybookDir}/preview`);
    } catch (_) {
      /* noop */
    }
  })();

  const { stories } = await importStorybookConfig();
  const contexts = stories.map((input) => {
    const {
      path: storiesPath,
      recursive,
      match,
    } = toRequireContext(input) as {
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
      if (isMaster) logger.error(error);
    }
  }

  watcher?.add(config.storybookDir);
  watcher?.on('all', (_event, filename) => {
    disposeCallback(module.hot?.data);
    delete require.cache[filename];
    void startStorybook();
  });

  void startStorybook();
}

export async function loadStories(
  config: Config,
  { watch, debug }: { watch: boolean; debug: boolean },
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
): Promise<SetStoriesData> {
  const storybookApi = await initStorybookEnvironment();
  const Events = await importStorybookCoreEvents();

  const { channel } = storybookApi;
  channel.removeAllListeners(Events.CURRENT_STORY_WAS_SET);
  channel.on('storiesUpdated', storiesListener);

  let watcher: FSWatcher | null = null;
  if (watch) watcher = chokidar.watch([], { ignoreInitial: true });

  const loadPromise = new Promise<SetStoriesData>((resolve) => {
    channel.once(Events.SET_STORIES, (data: SetStoriesData) => {
      const stories = isStorybookVersionLessThan(6) ? data.stories : flatStories(data);
      const files = new Set(Object.values(stories).map((story) => story.parameters.fileName));

      if (watcher) channel.on(Events.SET_STORIES, watchStories(channel, watcher, files));

      resolve(data);
    });
  });

  if (config.useWebpackToExtractTests) loadStoriesFromBundle(watch);
  else void loadStoriesDirectly(config, { watcher, debug });

  return loadPromise;
}
