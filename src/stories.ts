import { readdirSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
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

function storyTestFabric(delay?: number) {
  return async function storyTest(this: Context) {
    delay ? await new Promise(resolve => setTimeout(resolve, delay)) : void 0;
    await this.expect(await this.takeScreenshot()).to.matchImage();
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
      const { delay, tests: storyTests, skip }: CreeveyStoryParams = story.parameters.creevey ?? {};
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

// TODO Use AST Transformation to exclude all unneeded stuff except tests and stories meta
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
