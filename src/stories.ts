import path from 'path';
import { createHash } from 'crypto';
import { PNG } from 'pngjs';
import chai, { expect } from 'chai';
import { Context } from 'mocha';
import { addHook } from 'pirates';
import createChannel from '@storybook/channel-postmessage';
import addons from '@storybook/addons';
import { logger } from '@storybook/client-logger';
import selenium, { By, WebDriver } from 'selenium-webdriver';
import { isDefined, Test, CreeveyStoryParams, StoriesRaw, noop } from './types';
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
    var textnode = document.createTextNode(stylesheet);
    style.setAttribute('type', 'text/css');
    style.appendChild(textnode);
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
  const xOffset = isFitHorizontally ? elementRect.left : Math.max(0, cols * windowSize.width - elementRect.width);
  const yOffset = isFitVertically ? elementRect.top : Math.max(0, rows * windowSize.height - elementRect.height);

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
  const compositeImage = new PNG({ width: elementRect.width, height: elementRect.height });

  for (let y = 0; y < elementRect.height; y += 1) {
    for (let x = 0; x < elementRect.width; x += 1) {
      const col = Math.floor(x / windowSize.width);
      const row = Math.floor(y / windowSize.height);
      const isLastCol = cols - col == 1;
      const isLastRow = rows - row == 1;
      const i = (y * elementRect.width + x) * 4;
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
  testPath: string[],
  testFn: (this: Context) => Promise<void>,
  skip: string | boolean,
): Test & { fn: (this: Context) => Promise<void> } {
  const testId = createHash('sha1')
    .update(testPath.join('/'))
    .digest('hex');
  return {
    id: testId,
    fn: testFn,
    path: testPath,
    retries: 0,
    skip,
  };
}

export function convertStories(
  browsers: string[],
  stories: StoriesRaw,
): Partial<{ [id: string]: Test & { fn: (this: Context) => Promise<void> } }> {
  const creeveyTests: { [id: string]: Test & { fn: (this: Context) => Promise<void> } } = {};

  Object.values(stories)
    .filter(isDefined)
    .forEach(story => {
      browsers.forEach(browserName => {
        const { skip, captureElement, _seleniumTests }: CreeveyStoryParams = story.parameters.creevey ?? {};
        const skipReason = skip ? shouldSkip(story, browserName, skip) : false;

        // typeof tests === "undefined" => rootSuite -> kindSuite -> storyTest -> [browsers.png]
        // typeof tests === "function"  => rootSuite -> kindSuite -> storyTest -> browser -> [images.png]
        // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
        // typeof tests === "object"    => rootSuite -> kindSuite -> storySuite -> test -> browser -> [images.png]

        if (!_seleniumTests) {
          const test = createCreeveyTest(
            [browserName, story.name, story.kind],
            storyTestFabric(captureElement),
            skipReason,
          );
          creeveyTests[test.id] = test;
          return;
        }

        Object.entries(_seleniumTests(selenium, chai)).forEach(([testName, testFn]) => {
          const test = createCreeveyTest([browserName, testName, story.name, story.kind], testFn, skipReason);
          creeveyTests[test.id] = test;
        });
      });
    });

  return creeveyTests;
}

export function loadStories(storybookDir: string): Promise<StoriesRaw> {
  require('jsdom-global/register');

  // TODO register css/less/scss/png/jpg/woff/ttf/etc require extensions
  addHook(() => '', {
    exts: ['.less', '.css', '.png'],
    ignoreNodeModules: false,
  });

  // NOTE Cutoff `jsdom` part from userAgent, because storybook check enviroment and create events channel if runs in browser
  // https://github.com/storybookjs/storybook/blob/v5.2.8/lib/core/src/client/preview/start.js#L98
  // Example: "Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/15.2.1"
  Object.defineProperty(window.navigator, 'userAgent', {
    value: window.navigator.userAgent.replace(/jsdom\/(\d+\.?)+/, '').trim(),
  });

  // NOTE Disable storybook debug output due issue https://github.com/storybookjs/storybook/issues/8461
  const { debug } = logger;
  logger.debug = noop;

  const storybookPath = path.join(storybookDir, 'config');
  const channel = createChannel({ page: 'preview' });
  const storiesPromise = new Promise<StoriesRaw>(resolve => {
    channel.once('setStories', (data: { stories: StoriesRaw }) => {
      resolve(data.stories);

      setTimeout(() => (logger.debug = debug), 100);
    });
  });

  addons.setChannel(channel);
  requireConfig(storybookPath);

  return storiesPromise;
}
