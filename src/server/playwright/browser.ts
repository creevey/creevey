import { Browser, Page, chromium } from 'playwright-core';
import { Context, Suite, Test } from 'mocha';
import Logger from 'loglevel';
import chalk from 'chalk';
import {
  BrowserConfigObject,
  Config,
  CreeveyBrowser,
  CreeveyStoryParams,
  Options,
  StoriesRaw,
  StoryInput,
} from '../../types';
import { appendIframePath, LOCALHOST_REGEXP, storybookRootID } from '../utils';
import { logger } from '../logger';
import { SET_GLOBALS } from '@storybook/core-events';
import { emitStoriesMessage, subscribeOn } from '../messages';

let browserLogger = logger;
let browser: Browser | null = null;
let page: Page | null = null;

async function openStorybookPage(
  browser: Browser,
  storybookUrl: string,
  resolver?: () => Promise<string>,
): Promise<Page> {
  // TODO Maybe use waituntil option
  const page = await browser.newPage();
  if (!LOCALHOST_REGEXP.test(storybookUrl)) {
    await page.goto(appendIframePath(storybookUrl));
    return page;
  }

  try {
    if (resolver) {
      browserLogger.debug('Resolving storybook url with custom resolver');

      const resolvedUrl = await resolver();

      browserLogger.debug(`Resolver storybook url ${resolvedUrl}`);

      await page.goto(appendIframePath(resolvedUrl));
      return page;
    } else {
      throw new Error('Not Implemented');
      // TODO
      // await resolveStorybookUrl(appendIframePath(storybookUrl), getUrlChecker(browser));
    }
  } catch (error) {
    browserLogger.error('Failed to resolve storybook URL', error instanceof Error ? error.message : '');
    throw error;
  }
}

// TODO Duplicated code with selenium
async function waitForStorybook(page: Page): Promise<void> {
  browserLogger.debug('Waiting for `setStories` event to make sure that storybook is initiated');

  const isTimeout = await Promise.race([
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 60000);
    }),
    (async () => {
      let wait = true;
      do {
        try {
          // TODO Research a different way to ensure storybook is initiated
          wait = await page.evaluate((SET_GLOBALS: string) => {
            if (typeof window.__STORYBOOK_ADDONS_CHANNEL__ == 'undefined') return true;
            if (window.__STORYBOOK_ADDONS_CHANNEL__.last(SET_GLOBALS) == undefined) return true;
            return false;
          }, SET_GLOBALS);
        } catch (e: unknown) {
          browserLogger.debug('An error has been caught during the script:', e);
        }
      } while (wait);
      return false;
    })(),
  ]);

  // TODO Change the message to describe a reason why it might happen
  if (isTimeout) throw new Error('Failed to wait `setStories` event');
}

async function takeScreenshot(
  page: Page,
  captureElement?: string | null,
  ignoreElements?: string | string[] | null,
): Promise<string> {
  // TODO Implement features from selenium `takeScreenshot`
  const ignore = Array.isArray(ignoreElements) ? ignoreElements : ignoreElements ? [ignoreElements] : [];
  const mask = ignore.map((el) => page.locator(el));
  const buf = captureElement
    ? await (await page.$(captureElement))?.screenshot({ animations: 'disabled', mask })
    : await page.screenshot({ animations: 'disabled', mask, fullPage: true });

  if (!buf) throw new Error('We are sorry');

  return buf.toString('base64');
}

// async function updateStorybookGlobals(browser: Browser, globals: StorybookGlobals): Promise<void> {
// }

async function loadStoriesFromBrowser(): Promise<StoriesRaw> {
  if (!page) throw new Error("Can't get stories from browser if webdriver isn't connected");

  const stories = await page.evaluate<StoriesRaw | undefined>(async () => {
    return window.__CREEVEY_GET_STORIES__();
  });

  if (!stories) throw new Error("Can't get stories, it seems creevey or storybook API isn't available");

  return stories;
}

// TODO Pass port from docker container with playwright server
async function getBrowser(config: Config, options: Options & { browser: string }): Promise<Page | null> {
  if (page) return page;

  const browserName = options.browser;
  const browserConfig = config.browsers[browserName] as BrowserConfigObject;
  const {
    // TODO Support Selenium Grid 4
    // gridUrl = config.gridUrl,
    storybookUrl: address = config.storybookUrl,
    limit,
    // viewport, // TODO change window size
    // _storybookGlobals,
    // ...userCapabilities
  } = browserConfig;
  void limit;
  const realAddress = address;

  subscribeOn('shutdown', () => {
    void closeBrowser().finally(() => process.exit());
  });

  await new Promise<void>((resolve) => setTimeout(resolve, 1000));

  browser = await chromium.connect('ws://localhost:4444/creevey');

  // TODO Add uniq identifier
  browserLogger = Logger.getLogger('creevey');

  page = await openStorybookPage(browser, realAddress, config.resolveStorybookUrl);

  await waitForStorybook(page);

  // TODO Catch errors
  // TODO Globals
  // TODO Creevey host
  // TODO Resize window

  return page;
}

async function closeBrowser(): Promise<void> {
  await page?.close();
  await browser?.close();
}

async function selectStory(page: Page, storyId: string, waitForReady = false): Promise<boolean> {
  browserLogger.debug(`Triggering 'SetCurrentStory' event with storyId ${chalk.magenta(storyId)}`);

  const result = await page.evaluate<
    [error?: string | null, isCaptureCalled?: boolean] | null,
    [id: string, shouldWaitForReady: boolean]
  >(
    ([id, shouldWaitForReady]) => {
      if (typeof window.__CREEVEY_SELECT_STORY__ == 'undefined') {
        return [
          "Creevey can't switch story. This may happened if forget to add `creevey` addon to your storybook config, or storybook not loaded in browser due syntax error.",
        ];
      }
      return window.__CREEVEY_SELECT_STORY__(id, shouldWaitForReady);
    },
    [storyId, waitForReady],
  );

  const [errorMessage, isCaptureCalled = false] = result ?? [];

  if (errorMessage) throw new Error(errorMessage);

  return isCaptureCalled;
}

// TODO Change to proper type
async function switchStory(context: Context & { browser: Page }): Promise<void> {
  let testOrSuite: Test | Suite | undefined = context.currentTest;

  const browser: Page = context.browser;

  if (!testOrSuite) throw new Error("Can't switch story, because test context doesn't have 'currentTest' field");

  context.testScope.length = 0;
  context.screenshots.length = 0;
  context.testScope.push(context.browserName);
  while (testOrSuite?.title) {
    context.testScope.push(testOrSuite.title);
    testOrSuite = testOrSuite.parent;
  }
  const story = context.currentTest?.ctx?.story as StoryInput | undefined;

  if (!story) throw new Error(`Current test '${context.testScope.join('/')}' context doesn't have 'story' field`);

  const { id, title, name, parameters } = story;
  const {
    captureElement = `#${storybookRootID}`,
    waitForReady,
    ignoreElements,
  } = (parameters.creevey ?? {}) as CreeveyStoryParams;

  browserLogger.debug(`Switching to story ${chalk.cyan(title)}/${chalk.cyan(name)} by id ${chalk.magenta(id)}`);

  if (captureElement)
    Object.defineProperty(context, 'captureElement', {
      enumerable: true,
      configurable: true,
      get: () => browser.$(captureElement),
    });
  else Reflect.deleteProperty(context, 'captureElement');

  context.takeScreenshot = () => takeScreenshot(browser, captureElement, ignoreElements);
  context.updateStoryArgs = () => {
    throw new Error('Not Implemented');
  };
  // context.updateStoryArgs = (updatedArgs: Args) => updateStoryArgs(browser, story, updatedArgs);

  context.testScope.reverse();

  let storyPlayResolver: (isCompleted: boolean) => void;
  let waitForComplete = new Promise<boolean>((resolve) => (storyPlayResolver = resolve));
  const unsubscribe = subscribeOn('stories', (message) => {
    if (message.type != 'capture') return;
    const { payload = {}, payload: { imageName } = {} } = message;
    void takeScreenshot(
      browser,
      payload.captureElement ?? captureElement,
      payload.ignoreElements ?? ignoreElements,
    ).then((screenshot) => {
      context.screenshots.push({ imageName, screenshot });

      void browser
        .evaluate<boolean>(() => window.__CREEVEY_HAS_PLAY_COMPLETED_YET__())
        .then((isCompleted) => {
          storyPlayResolver(isCompleted);
        });

      emitStoriesMessage({ type: 'capture' });
    });
  });

  // TODO
  // await resetMousePosition(browser);
  const isCaptureCalled = await selectStory(browser, id, waitForReady);

  if (isCaptureCalled) {
    while (!(await waitForComplete)) {
      waitForComplete = new Promise<boolean>((resolve) => (storyPlayResolver = resolve));
    }
  }

  unsubscribe();

  browserLogger.debug(`Story ${chalk.magenta(id)} ready for capturing`);
}

export const playwrightBrowser: CreeveyBrowser<Page> = {
  getBrowser,
  loadStoriesFromBrowser,
  switchStory,
  closeBrowser,
};
