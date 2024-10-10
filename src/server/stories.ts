import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import _ from 'lodash';
import type { Context } from 'mocha';
import type {
  TestData,
  CreeveyStoryParams,
  StoriesRaw,
  SkipOptions,
  ServerTest,
  StoryInput,
  CreeveyTestFunction,
} from '../types.js';
import { isDefined, isFunction } from '../types.js';
import { shouldSkip } from './utils.js';

function storyTestFabric(delay?: number, testFn?: CreeveyTestFunction) {
  return async function storyTest(this: Context) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await (testFn
      ? testFn.call(this)
      : this.screenshots.length > 0
        ? this.expect(
            this.screenshots.reduce(
              (screenshots, { imageName, screenshot }, index) => ({
                ...screenshots,
                [imageName ?? `screenshot_${index}`]: screenshot,
              }),
              {},
            ),
          ).to.matchImages()
        : this.expect(await this.takeScreenshot()).to.matchImage());
  };
}

function createCreeveyTest(
  browser: string,
  storyMeta: StoryInput,
  skipOptions?: SkipOptions,
  testName?: string,
): TestData {
  const { title, name, id: storyId } = storyMeta;
  const path = [title, name, testName, browser].filter(isDefined);
  const skip = skipOptions ? shouldSkip(browser, { title, name }, skipOptions, testName) : false;
  const id = createHash('sha1').update(path.join('/')).digest('hex');
  return { id, skip, browser, testName, storyPath: [...title.split('/').map((x) => x.trim()), name], storyId };
}

function convertStories(browserName: string, stories: StoriesRaw | StoryInput[]): Partial<Record<string, ServerTest>> {
  const tests: Record<string, ServerTest> = {};

  (Array.isArray(stories) ? stories : Object.values(stories)).forEach((storyMeta) => {
    // TODO Skip docsOnly stories for now
    if (storyMeta.parameters.docsOnly) return;

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

  return tests;
}

export async function loadTestsFromStories(
  browsers: string[],
  provider: (storiesListener: (stories: Map<string, StoryInput[]>) => void) => Promise<StoriesRaw>,
  update?: (testsDiff: Partial<Record<string, ServerTest>>) => void,
): Promise<Partial<Record<string, ServerTest>>> {
  const testIdsByFiles = new Map<string, string[]>();
  const stories = await provider((storiesByFiles) => {
    const testsDiff: Partial<Record<string, ServerTest>> = {};
    const tests: Partial<Record<string, ServerTest>> = {};
    browsers.forEach((browser) => {
      Array.from(storiesByFiles.entries()).forEach(([filename, stories]) => {
        Object.assign(tests, convertStories(browser, stories));
        const changed = Object.keys(tests);
        const removed = testIdsByFiles.get(filename)?.filter((testId) => !tests[testId]) ?? [];
        if (changed.length == 0) testIdsByFiles.delete(filename);
        else testIdsByFiles.set(filename, changed);

        Object.assign(testsDiff, tests);
        removed.forEach((testId) => (testsDiff[testId] = undefined));
      });
    });
    update?.(testsDiff);
  });

  const tests = browsers.reduce(
    (tests: Partial<Record<string, ServerTest>>, browser) => Object.assign(tests, convertStories(browser, stories)),
    {},
  );

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
        testIdsByFiles.set(fileName as string, [...(testIdsByFiles.get(fileName as string) ?? []), id]),
    );

  return tests;
}

export function saveTestsJson(tests: Record<string, unknown>, dstPath: string = process.cwd()): void {
  mkdirSync(dstPath, { recursive: true });
  writeFileSync(
    path.join(dstPath, 'tests.json'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    JSON.stringify(tests, (_, value) => (isFunction(value) ? value.toString() : value), 2),
  );
}
