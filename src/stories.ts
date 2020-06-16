import path from 'path';
import { createHash } from 'crypto';
import { Context } from 'mocha';
import chokidar from 'chokidar';
import { Channel } from '@storybook/channels';
import addons from '@storybook/addons';
import { ClientApi } from '@storybook/client-api';
import Events from '@storybook/core-events';
import { logger } from '@storybook/client-logger';
import {
  isDefined,
  Test,
  CreeveyStoryParams,
  StoriesRaw,
  noop,
  SkipOptions,
  ServerTest,
  StoryInput,
  WebpackMessage,
  CreeveyTestFunction,
} from './types';
import { shouldSkip, subscribeOn } from './utils';
import { readFileSync } from 'fs';

function storyTestFabric(delay?: number, testFn?: CreeveyTestFunction) {
  return async function storyTest(this: Context) {
    delay ? await new Promise((resolve) => setTimeout(resolve, delay)) : void 0;
    await (testFn?.call(this) ?? this.expect(await this.takeScreenshot()).to.matchImage());
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
  const skip = skipOptions ? shouldSkip(meta, skipOptions, testName) : false;
  const id = createHash('sha1').update(path.join('/')).digest('hex');
  return { id, skip, path };
}

export function convertStories(
  browsers: string[],
  stories: StoriesRaw | StoryInput[],
): Partial<{ [testId: string]: ServerTest }> {
  const tests: { [testId: string]: ServerTest } = {};

  (Array.isArray(stories) ? stories : Object.values(stories)).forEach((story) => {
    browsers.forEach((browserName) => {
      const { delay, tests: storyTests, skip } = (story.parameters.creevey ?? {}) as CreeveyStoryParams;
      const meta = { browser: browserName, story: story.name, kind: story.kind };

      // typeof tests === "undefined" => rootSuite -> kindSuite -> storyTest -> [browsers.png]
      // typeof tests === "function"  => rootSuite -> kindSuite -> storyTest -> browser -> [images.png]
      // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
      // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> browser -> [images.png]

      if (!storyTests) {
        const test = createCreeveyTest(meta, skip);
        tests[test.id] = { ...test, story, fn: storyTestFabric(delay) };
        return;
      }

      Object.entries(storyTests).forEach(([testName, testFn]) => {
        const test = createCreeveyTest(meta, skip, testName);
        tests[test.id] = { ...test, story, fn: storyTestFabric(delay, testFn) };
      });
    });
  });

  return tests;
}

function initStorybookEnvironment(): { clientApi: ClientApi; channel: Channel } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  require('jsdom-global')(undefined, { url: 'http://localhost' });

  // NOTE Cutoff `jsdom` part from userAgent, because storybook check enviroment and create events channel if runs in browser
  // https://github.com/storybookjs/storybook/blob/v5.2.8/lib/core/src/client/preview/start.js#L98
  // Example: "Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/15.2.1"
  Object.defineProperty(window.navigator, 'userAgent', {
    value: window.navigator.userAgent.replace(/jsdom\/(\d+\.?)+/, '').trim(),
  });

  // NOTE Disable storybook debug output due issue https://github.com/storybookjs/storybook/issues/8461
  // TODO We could redefine loglevel using `console.setLevel(LOGLEVEL);` from `loglevel` lib. Worked only for 6.x
  // Fixed in 6.x
  logger.debug = noop;

  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const { default: storybookCore } = require('@storybook/core');

  // TODO Storybook 6.x change value returned by `start` method
  /*
   * 6.x
   * return { configure, clientApi, configApi, channel, forceReRender };
   * 5.x
   * return { configure, clientApi, configApi, context: { channel, ... }, forceReRender };
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const { clientApi, context, channel = context.channel } = storybookCore.start(() => void 0);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { clientApi, channel };
}

function watchStories(filesListPath: string): void {
  const watchingFiles = new Set(JSON.parse(readFileSync(filesListPath, { encoding: 'utf-8' })) as string[]);
  const changedFiles = new Set<string>();
  let previousStoryFiles = new Set<string>();

  const watcher = chokidar.watch([...watchingFiles, filesListPath], { ignoreInitial: true });

  subscribeOn('shutdown', () => void watcher.close());

  watcher.on('change', (filePath) => {
    if (filePath === filesListPath) {
      const files = new Set(JSON.parse(readFileSync(filesListPath, { encoding: 'utf-8' })) as string[]);
      const addedFiles = Array.from(files).filter((filePath) => !watchingFiles.has(filePath));
      const removedFiles = Array.from(watchingFiles).filter((filePath) => !files.has(filePath));
      watcher.add(addedFiles);
      addedFiles.forEach((filePath) => watchingFiles.add(filePath));
      watcher.unwatch(removedFiles);
      removedFiles.forEach((filePath) => watchingFiles.delete(filePath));
    } else {
      changedFiles.add(filePath);
    }
  });
  watcher.on('unlink', (filePath) => {
    if (filePath !== filesListPath) {
      changedFiles.add(filePath);
    }
  });

  // NOTE Update kinds after file with stories was changed
  addons.getChannel().on(Events.SET_STORIES, (data: { stories: StoriesRaw }) => {
    const storiesByFiles = new Map<string, StoryInput[]>();
    const storyFiles = new Set<string>();
    const changed = Array.from(changedFiles);

    Object.values(data.stories).forEach((story) => {
      // TODO Fix `filename` -> `fileName` parameter after 6.x, maybe
      const fileName = story.parameters.fileName as string;
      const absolutePath = changed.find((absolutePath) => absolutePath.endsWith(path.normalize(fileName)));

      // TODO Stories are not removing because of lack dummy-hmr
      storyFiles.add(fileName);
      previousStoryFiles.delete(fileName);

      if (absolutePath) {
        if (!storiesByFiles.has(fileName)) storiesByFiles.set(fileName, []);
        storiesByFiles.get(fileName)?.push(story);
      }
      // TODO Add debug output if path not found
    });
    previousStoryFiles.forEach((fileName) => storiesByFiles.set(fileName, []));
    previousStoryFiles = storyFiles;
    changedFiles.clear();
    addons.getChannel().emit('storiesUpdated', storiesByFiles);
  });
}

function loadStorybookBundle(
  {
    bundlePath,
    watch,
  }: {
    bundlePath: string;
    watch: boolean;
  },
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
): Promise<StoriesRaw> {
  return new Promise((resolve) => {
    const { channel } = initStorybookEnvironment();

    channel.once(Events.SET_STORIES, (data: { stories: StoriesRaw }) => resolve(data.stories));
    channel.on('storiesUpdated', storiesListener);

    if (watch) {
      watchStories(path.join(path.dirname(bundlePath), 'files.json'));

      subscribeOn('webpack', (message: WebpackMessage) => {
        if (message.type != 'rebuild succeeded') return;

        delete require.cache[bundlePath];
        require(bundlePath);
      });
    }

    require(bundlePath);
  });
}

export async function loadTestsFromStories(
  { browsers, storybookBundlePath, watch }: { browsers: string[]; storybookBundlePath: string; watch: boolean },
  applyTestsDiff: (testsDiff: Partial<{ [id: string]: ServerTest }>) => void,
): Promise<Partial<{ [id: string]: ServerTest }>> {
  const testIdsByFiles = new Map<string, string[]>();
  const stories = await loadStorybookBundle({ bundlePath: storybookBundlePath, watch }, (storiesByFiles) => {
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
