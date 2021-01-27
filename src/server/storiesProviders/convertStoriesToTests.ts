import { createHash } from 'crypto';
import { Context } from 'mocha';
import {
  CreeveyStoryParams,
  CreeveyTestFunction,
  isDefined,
  ServerTest,
  SkipOptions,
  StoriesRaw,
  StoryInput,
  TestData,
} from '../../types';
import { shouldSkip } from '../utils';

export function convertStoriesToTests(
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

function storyTestFabric(delay?: number, testFn?: CreeveyTestFunction) {
  return async function storyTest(this: Context) {
    delay ? await new Promise((resolve) => setTimeout(resolve, delay)) : void 0;

    if (typeof testFn !== 'function') {
      return await this.expect(await this.takeScreenshot()).to.matchImage();
    }

    await testFn.call(this);
  };
}
