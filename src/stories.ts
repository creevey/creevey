import path from 'path';
import { createHash } from 'crypto';
import { PNG } from 'pngjs';
import { expect } from 'chai';
import { Context } from 'mocha';
import createChannel from '@storybook/channel-postmessage';
import addons from '@storybook/addons';
import { logger } from '@storybook/client-logger';
import { By, WebDriver } from 'selenium-webdriver';
import { isDefined, Test, CreeveyStoryParams, StoriesRaw, noop, SkipOptions, StoryInput } from './types';
import { shouldSkip, requireConfig } from './utils';

declare global {
  interface Window {
    __CREEVEY_RESTORE_SCROLL__?: () => void;
  }
}

async function hideBrowserScroll(browser: WebDriver): Promise<() => Promise<void>> {
  const HideScrollStyles = `
html {
  overflow: -moz-scrollbars-none !important;
  -ms-overflow-style: none !important;
}
html::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
}
`;

  await browser.executeScript(function(stylesheet: string) {
    /* eslint-disable no-var */
    var style = document.createElement('style');
    var textNode = document.createTextNode(stylesheet);
    style.setAttribute('type', 'text/css');
    style.appendChild(textNode);
    document.head.appendChild(style);

    window.__CREEVEY_RESTORE_SCROLL__ = function() {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      delete window.__CREEVEY_RESTORE_SCROLL__;
    };
    /* eslint-enable no-var */
  }, HideScrollStyles);

  return () =>
    browser.executeScript(function() {
      if (window.__CREEVEY_RESTORE_SCROLL__) {
        window.__CREEVEY_RESTORE_SCROLL__();
      }
    });
}

async function takeCompositeScreenshot(
  browser: WebDriver,
  windowSize: { width: number; height: number },
  elementRect: DOMRect,
): Promise<string> {
  const screens = [];
  const cols = Math.ceil(elementRect.width / windowSize.width);
  const rows = Math.ceil(elementRect.height / windowSize.height);
  const isFitHorizontally = windowSize.width >= elementRect.width + elementRect.left;
  const isFitVertically = windowSize.height >= elementRect.height + elementRect.top;
  const xOffset = Math.round(
    isFitHorizontally ? elementRect.left : Math.max(0, cols * windowSize.width - elementRect.width),
  );
  const yOffset = Math.round(
    isFitVertically ? elementRect.top : Math.max(0, rows * windowSize.height - elementRect.height),
  );

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const dx = Math.min(windowSize.width * col + elementRect.left, Math.max(0, elementRect.right - windowSize.width));
      const dy = Math.min(
        windowSize.height * row + elementRect.top,
        Math.max(0, elementRect.bottom - windowSize.height),
      );
      await browser.executeScript(
        function(x: number, y: number) {
          window.scrollTo(x, y);
        },
        dx,
        dy,
      );
      screens.push(await browser.takeScreenshot());
    }
  }

  const images = screens.map(s => Buffer.from(s, 'base64')).map(b => PNG.sync.read(b));
  const compositeImage = new PNG({ width: Math.round(elementRect.width), height: Math.round(elementRect.height) });

  for (let y = 0; y < compositeImage.height; y += 1) {
    for (let x = 0; x < compositeImage.width; x += 1) {
      const col = Math.floor(x / windowSize.width);
      const row = Math.floor(y / windowSize.height);
      const isLastCol = cols - col == 1;
      const isLastRow = rows - row == 1;
      const i = (y * compositeImage.width + x) * 4;
      const j =
        ((y % windowSize.height) * windowSize.width + (x % windowSize.width)) * 4 +
        (isLastRow ? yOffset * windowSize.width * 4 : 0) +
        (isLastCol ? xOffset * 4 : 0);
      const image = images[row * cols + col];
      compositeImage.data[i + 0] = image.data[j + 0];
      compositeImage.data[i + 1] = image.data[j + 1];
      compositeImage.data[i + 2] = image.data[j + 2];
      compositeImage.data[i + 3] = image.data[j + 3];
    }
  }
  return PNG.sync.write(compositeImage).toString('base64');
}

async function takeScreenshot(browser: WebDriver, captureElement?: string): Promise<string> {
  if (!captureElement) return browser.takeScreenshot();

  const restoreScroll = await hideBrowserScroll(browser);
  const { elementRect, windowSize } = await browser.executeScript(function(selector: string) {
    return {
      elementRect: document.querySelector(selector)?.getBoundingClientRect(),
      windowSize: { width: window.innerWidth, height: window.innerHeight },
    };
  }, captureElement);

  const isFitIntoViewport =
    elementRect.width + elementRect.left <= windowSize.width &&
    elementRect.height + elementRect.top <= windowSize.height;

  const screenshot = await (isFitIntoViewport
    ? browser.findElement(By.css(captureElement)).takeScreenshot()
    : takeCompositeScreenshot(browser, windowSize, elementRect));

  await restoreScroll();

  return screenshot;
}

function storyTestFabric(captureElement?: string) {
  return async function storyTest(this: Context) {
    const screenshot = await takeScreenshot(this.browser, captureElement);
    await expect(screenshot).to.matchImage();
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
  const skip = skipOptions ? shouldSkip(meta, skipOptions) : false;
  const id = createHash('sha1')
    .update(path.join('/'))
    .digest('hex');
  return {
    id,
    skip,
    path,
    retries: 0,
  };
}

export function convertStories(
  browsers: string[],
  rawStories: StoriesRaw,
): {
  tests: Partial<{ [testId: string]: Test }>;
  fns: { [testId: string]: (this: Context) => Promise<void> };
  stories: { [testId: string]: StoryInput };
} {
  const tests: { [testId: string]: Test } = {};
  const fns: { [testId: string]: (this: Context) => Promise<void> } = {};
  const stories: { [testId: string]: StoryInput } = {};

  Object.values(rawStories)
    .filter(isDefined)
    .forEach(story => {
      browsers.forEach(browserName => {
        const { captureElement, tests: storyTests, skip }: CreeveyStoryParams = story.parameters.creevey ?? {};
        const meta = { browser: browserName, story: story.name, kind: story.kind };

        // typeof tests === "undefined" => rootSuite -> kindSuite -> storyTest -> [browsers.png]
        // typeof tests === "function"  => rootSuite -> kindSuite -> storyTest -> browser -> [images.png]
        // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
        // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> browser -> [images.png]

        if (!storyTests) {
          const test = createCreeveyTest(meta, skip);
          tests[test.id] = test;
          fns[test.id] = storyTestFabric(captureElement);
          stories[test.id] = story;
          return;
        }

        Object.entries(storyTests).forEach(([testName, testFn]) => {
          const test = createCreeveyTest(meta, skip, testName);
          tests[test.id] = test;
          fns[test.id] = testFn;
          stories[test.id] = story;
        });
      });
    });

  return { tests, fns, stories };
}

export function loadStories(storybookDir: string, enableFastStoriesLoading: boolean): Promise<StoriesRaw> {
  require('jsdom-global/register');

  // NOTE Cutoff `jsdom` part from userAgent, because storybook check enviroment and create events channel if runs in browser
  // https://github.com/storybookjs/storybook/blob/v5.2.8/lib/core/src/client/preview/start.js#L98
  // Example: "Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/15.2.1"
  Object.defineProperty(window.navigator, 'userAgent', {
    value: window.navigator.userAgent.replace(/jsdom\/(\d+\.?)+/, '').trim(),
  });

  // NOTE Disable storybook debug output due issue https://github.com/storybookjs/storybook/issues/8461
  logger.debug = noop;

  const storybookPath = path.join(storybookDir, 'config');
  const channel = createChannel({ page: 'preview' });
  const storiesPromise = new Promise<StoriesRaw>(resolve => {
    channel.once('setStories', (data: { stories: StoriesRaw }) => {
      resolve(data.stories);
    });
  });

  addons.setChannel(channel);

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const { wrap } = module.constructor;

  if (enableFastStoriesLoading) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    module.constructor.wrap = function(script: string) {
      // TODO Add AST analyzer, to implement tree-shaking
      return wrap(
        `const shouldSkip = !(${function(storybookPath: string) {
          const { filename: parentFilename } = require.cache[__filename].parent ?? {};

          return (
            __filename.includes(storybookPath) ||
            parentFilename?.includes(storybookPath) ||
            (__filename.includes('node_modules') &&
              (__filename.includes('@storybook') || parentFilename?.includes('node_modules')))
          );
        }.toString()})(${JSON.stringify(storybookPath)});

      if (shouldSkip) return module.exports = {};

      ${script}`,
      );
    };
  }

  requireConfig(storybookPath);

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  module.constructor.wrap = wrap;

  return storiesPromise;
}
