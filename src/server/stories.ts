import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { mergeWith } from 'lodash';
import type { Context } from 'mocha';
import type {
  TestData,
  CreeveyStoryParams,
  StoriesRaw,
  SkipOptions,
  ServerTest,
  StoryInput,
  CreeveyTestFunction,
  SetStoriesData,
} from '../types';
import { isDefined, isFunction, isObject } from '../types';
import { shouldSkip, removeProps } from './utils';
import { isStorybookVersionLessThan } from './storybook/helpers';

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
    // TODO Skip docsOnly stories for now
    if (storyMeta.parameters.docsOnly) return;

    browsers.forEach((browserName) => {
      const { delay: delayParam, tests: storyTests, skip } = (storyMeta.parameters.creevey ?? {}) as CreeveyStoryParams;
      const delay =
        typeof delayParam == 'number' ? delayParam : delayParam?.for.includes(browserName) ? delayParam.ms : 0;

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

// TODO use the storybook version, after the fix of skip option API
export function flatStories({ globalParameters, kindParameters, stories }: SetStoriesData): StoriesRaw {
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

export async function loadTestsFromStories(
  browsers: string[],
  provider: (storiesListener: (stories: Map<string, StoryInput[]>) => void) => Promise<SetStoriesData>,
  update?: (testsDiff: Partial<{ [id: string]: ServerTest }>) => void,
): Promise<Partial<{ [id: string]: ServerTest }>> {
  const testIdsByFiles = new Map<string, string[]>();
  const data = await provider((storiesByFiles) => {
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

  const stories = isStorybookVersionLessThan(6) ? data.stories : flatStories(data);
  const tests = convertStories(browsers, stories);

  Object.values(tests)
    .filter(isDefined)
    .forEach(
      ({
        id,
        story: {
          parameters: { fileName },
        },
      }) =>
        // TODO Don't use filename as a key, due possible collisions if two require.context with same structure of modules are defined
        testIdsByFiles.set(fileName, [...(testIdsByFiles.get(fileName) ?? []), id]),
    );

  return tests;
}

// TODO convert stories
export function saveStoriesJson(storiesData: SetStoriesData, extract: string | boolean): void {
  const outputDir = typeof extract == 'boolean' ? 'storybook-static' : extract;
  // TODO Fix args stories
  removeProps(storiesData ?? {}, ['stories', () => true, 'parameters', '__isArgsStory']);
  Object.values(storiesData?.stories ?? {}).forEach(
    (story) =>
      isObject(story) && 'parameters' in story && isObject(story.parameters) && delete story.parameters.__isArgsStory,
  );
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'stories.json'), JSON.stringify(storiesData, null, 2));
}

export function saveTestsJson(tests: Record<string, unknown>, dstPath: string = process.cwd()): void {
  mkdirSync(dstPath, { recursive: true });
  writeFileSync(
    path.join(dstPath, 'tests.json'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    JSON.stringify(tests, (_, value) => (isFunction(value) ? value.toString() : value), 2),
  );
}
