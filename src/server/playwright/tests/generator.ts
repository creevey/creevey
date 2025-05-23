import path from 'path';
import assert from 'assert';
import { mkdirSync, readFileSync } from 'fs';
import { test, Page } from '@playwright/test';
import isEqual from 'lodash/isEqual.js';
import type { PixelmatchOptions } from 'pixelmatch';
import type { ODiffOptions } from 'odiff-bin';
import { CreeveyStoryParams, isObject, StoriesRaw, StorybookEvents, StorybookGlobals } from '../../../types';
import { getOdiffAssert, getPixelmatchAssert, ImageContext } from '../../compare';
import { appendIframePath } from '../../webdriver';
import { waitForStorybookReady } from './helpers';

export interface TestsConfig {
  /**
   * Absolute path to directory with reference images
   * @default path.join(process.cwd(), './images')
   */
  screenDir: string;
  /**
   * Absolute path where test reports and diff images would be saved
   * @default path.join(process.cwd(), './report')
   */
  reportDir: string;
  /**
   * Define pixelmatch diff options
   * @default { threshold: 0.1, includeAA: false }
   */
  diffOptions: PixelmatchOptions;
  /**
   * Define odiff diff options
   * @default { threshold: 0.1, antialiasing: true }
   */
  odiffOptions: ODiffOptions;
  /**
   * Define matcher for visual regression assertion
   * @default 'pixelmatch'
   */
  comparisonLibrary: 'pixelmatch' | 'odiff';
  /**
   * Enables page context reuse across tests for faster execution, though this breaks test isolation.
   * @default true
   */
  reusePageContext: boolean;
}

const defaultConfig: TestsConfig = {
  screenDir: path.join(process.cwd(), './images'),
  reportDir: path.join(process.cwd(), './report'),
  diffOptions: { threshold: 0.1, includeAA: false },
  odiffOptions: { threshold: 0.1, antialiasing: true },
  comparisonLibrary: 'pixelmatch',
  reusePageContext: true,
};

const cacheDir = process.env.CREEVEY_CACHE_DIR;

assert(cacheDir, 'Cache directory not found');

const storiesCache = JSON.parse(readFileSync(path.join(cacheDir, 'stories.json'), 'utf-8')) as StoriesRaw;

// TODO: Use this Storybook function for building args for query params
// export const buildArgsParam = (initialArgs: Args | undefined, args: Args): string => {

// TODO: Pass globals to story
function appendStoryQueryParams(url: string, storyId: string): string {
  return `${url}?args=&globals=&id=${storyId}`;
}

function assertWrapper(
  assert: (actual: Buffer, imageName?: string) => Promise<string | undefined>,
): (actual: Buffer, imageName?: string) => Promise<void> {
  return async function assertImage(actual, imageName) {
    try {
      const errorMessage = await assert(actual, imageName);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (error instanceof Error) {
        error.stack = error.stack
          ?.split('\n')
          .filter((line) => !line.includes('at assertImage'))
          .join('\n');
      }
      throw error;
    }
  };
}

async function takeScreenshot(
  page: Page,
  storyId: string,
  captureElement?: string | null,
  ignoreElements?: string | string[] | null,
): Promise<Buffer> {
  const ignore = ignoreElements ? (Array.isArray(ignoreElements) ? ignoreElements : [ignoreElements]) : [];
  // For Playwright's screenshot `mask` option, we need an array of Locators.
  const mask = ignore.map((selector) => page.locator(selector));

  if (captureElement) {
    const element = await page.$(captureElement);
    if (!element) throw new Error(`Capture element '${captureElement}' not found for story '${storyId}'`);
    return element.screenshot({
      style: ':root { overflow: hidden !important; }',
      animations: 'disabled',
      mask,
    });
  } else {
    return page.screenshot({
      animations: 'disabled',
      mask,
    });
  }
}

// TODO: How to support custom interactions for different tests
// Main function to define tests using Playwright's API
export function definePlaywrightTests(config?: Partial<TestsConfig>): void {
  const stories = storiesCache;
  let globals: StorybookGlobals = {};
  let reusedPage: Page;

  const { screenDir, reportDir, diffOptions, odiffOptions, comparisonLibrary, reusePageContext } = {
    ...defaultConfig,
    ...config,
  };

  async function updateGlobals(page: Page, storybookGlobals: unknown): Promise<void> {
    if (storybookGlobals && typeof storybookGlobals === 'object' && !isEqual(globals, storybookGlobals)) {
      globals = storybookGlobals as StorybookGlobals;
      await page.evaluate((globals) => {
        window.__STORYBOOK_ADDONS_CHANNEL__.emit(StorybookEvents.UPDATE_GLOBALS, { globals });
      }, globals);
    }
  }

  mkdirSync(reportDir, { recursive: true });

  test.describe('Creevey Tests', () => {
    const imagesContext: ImageContext = {
      attachments: [],
      testFullPath: [],
      images: {},
    };
    let assertImage: (actual: Buffer, imageName?: string) => Promise<void>;

    test.beforeAll('Setup images context', async ({ browser }, { project }) => {
      if (reusePageContext) {
        const storybookUrl = project.use.baseURL;

        assert(storybookUrl, 'Storybook URL not found');

        reusedPage = await browser.newPage();
        await reusedPage.goto(appendIframePath(storybookUrl), { waitUntil: 'networkidle', timeout: 60000 });
        await waitForStorybookReady(reusedPage);
      }
      if (comparisonLibrary === 'pixelmatch') {
        const { default: pixelmatch } = await import('pixelmatch');
        assertImage = assertWrapper(
          getPixelmatchAssert(pixelmatch, imagesContext, { screenDir, reportDir, diffOptions }),
        );
      } else {
        const { compare } = await import('odiff-bin');
        assertImage = assertWrapper(getOdiffAssert(compare, imagesContext, { screenDir, reportDir, odiffOptions }));
      }
    });

    test.beforeEach('Switch story', async ({ page }, { annotations, project }) => {
      const { description: storyId } = annotations.find((annotation) => annotation.type === 'storyId') ?? {};

      assert(storyId, 'Cannot get storyId. It seems like inner test annotation is missing');

      const story = stories[storyId];

      assert(story, `Story '${storyId}' not found in stories cache`);

      const { title, name } = story;

      const storybookGlobals: unknown = project.metadata.storybookGlobals;

      imagesContext.attachments = [];
      imagesContext.testFullPath = [...title.split('/').map((x) => x.trim()), name, project.name];
      imagesContext.images = {};

      if (!reusePageContext) {
        const storybookUrl = project.use.baseURL;

        assert(storybookUrl, 'Storybook URL not found');

        await page.goto(appendStoryQueryParams(appendIframePath(storybookUrl), storyId), {
          waitUntil: 'networkidle',
          timeout: 60000,
        });
        await waitForStorybookReady(page);
        // TODO: Pass globals to story
        await updateGlobals(page, storybookGlobals);

        return;
      }

      // 1. Update Storybook Globals
      await updateGlobals(reusedPage, storybookGlobals);

      // 2. Reset Mouse Position
      await reusedPage.mouse.move(0, 0);

      // 3. Select Story
      const selectResult = await reusedPage.evaluate<
        [error?: string | null, isCaptureCalled?: boolean] | null,
        { storyId: string; StorybookEvents: typeof StorybookEvents }
      >(
        async ({ storyId, StorybookEvents }) => {
          // TODO: Refactor this
          // NOTE: Copy-pasted from withCreevey.ts
          const channel = window.__STORYBOOK_ADDONS_CHANNEL__;

          let rejectCallback: (reason?: unknown) => void;
          const renderErrorPromise = new Promise<void>((_resolve, reject) => (rejectCallback = reject));

          function errorHandler({ title, description }: { title: string; description: string }): void {
            rejectCallback({
              message: title,
              stack: description,
            });
          }
          function exceptionHandler(exception: Error): void {
            rejectCallback(exception);
          }
          function removeErrorHandlers(): void {
            channel.off(StorybookEvents.STORY_ERRORED, errorHandler);
            channel.off(StorybookEvents.STORY_THREW_EXCEPTION, errorHandler);
          }

          channel.once(StorybookEvents.STORY_ERRORED, errorHandler);
          channel.once(StorybookEvents.STORY_THREW_EXCEPTION, exceptionHandler);

          let resolveCallback: () => void;
          const storyRenderedPromise = new Promise<void>((resolve) => (resolveCallback = resolve));
          function renderHandler(): void {
            resolveCallback();
          }
          function removeRenderHandlers(): void {
            channel.off(StorybookEvents.STORY_RENDERED, renderHandler);
          }

          channel.once(StorybookEvents.STORY_RENDERED, renderHandler);

          setTimeout(() => {
            channel.emit(StorybookEvents.SET_CURRENT_STORY, { storyId });
          }, 0);

          try {
            await Promise.race([renderErrorPromise, storyRenderedPromise]);
            return [null, true];
          } catch (reason) {
            // NOTE Event `STORY_THREW_EXCEPTION` triggered only in react and vue frameworks and return Error instance
            // NOTE Event `STORY_ERRORED` return error-like object without `name` field
            const errorMessage =
              reason instanceof Error
                ? (reason.stack ?? reason.message)
                : isObject(reason)
                  ? `${reason.message as string}\n    ${reason.stack as string}`
                  : (reason as string);
            return [errorMessage];
          } finally {
            removeErrorHandlers();
            removeRenderHandlers();
          }
        },
        { storyId: story.id, StorybookEvents },
      );

      const [errorMessage] = selectResult ?? [];

      if (errorMessage) {
        throw new Error(`Failed to select story '${story.id}': ${errorMessage}`);
      }
    });

    test.afterEach('Save screenshot', () => {
      const projectName = test.info().project.name;

      // TODO: Use another way to handle attachments

      const { actual, diff, expect } = imagesContext.images[projectName] ?? {};
      for (const image of imagesContext.attachments) {
        switch (true) {
          case image.includes('actual') && !!actual: {
            test.info().attachments.push({ name: actual, path: image, contentType: 'image/png' });
            // await test.info().attach(actual, { path: image });
            break;
          }
          case image.includes('expect') && !!expect: {
            test.info().attachments.push({ name: expect, path: image, contentType: 'image/png' });
            // await test.info().attach(expect, { path: image });
            break;
          }
          case image.includes('diff') && !!diff: {
            test.info().attachments.push({ name: diff, path: image, contentType: 'image/png' });
            // await test.info().attach(diff, { path: image });
            break;
          }
        }
      }
    });

    for (const story of Object.values(stories)) {
      const { name, title, parameters } = story;
      const { captureElement, ignoreElements } = (parameters.creevey ?? {}) as CreeveyStoryParams;

      test.describe(title, () => {
        // TODO: Support creevey.skip
        test(name, { annotation: [{ type: 'storyId', description: story.id }] }, async ({ page }) => {
          // 4. Take Screenshot
          const screenshot = await takeScreenshot(
            reusePageContext ? reusedPage : page,
            story.id,
            captureElement,
            ignoreElements,
          );

          // 5. Assert Image
          await assertImage(screenshot);
        });
      });
    }
  });
}
