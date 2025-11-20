import path from 'path';
import assert from 'assert';
import {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  BrowserType,
  Page,
  PageScreenshotOptions,
  chromium,
  firefox,
  webkit,
} from 'playwright-core';
import chalk from 'chalk';
import { v4 } from 'uuid';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import type { Args } from 'storybook/internal/types';
import { BrowserConfigObject, Config, StoriesRaw, StoryInput, StorybookEvents, StorybookGlobals } from '../../types';
import { appendIframePath, LOCALHOST_REGEXP, resolveStorybookUrl, storybookRootID } from '../webdriver';
import { getCreeveyCache, isShuttingDown, resolvePlaywrightBrowserType, runSequence } from '../utils';
import { colors, logger } from '../logger';
import { removeWorkerContainer } from '../worker/context';
import { getStories, selectStory } from '../storybook-helpers.js';

const browsers = {
  chromium,
  firefox,
  webkit,
};

async function tryConnect(type: BrowserType, gridUrl: string): Promise<Browser | null> {
  let timeout: NodeJS.Timeout | null = null;
  let isTimeout = false;
  let error: unknown = null;
  return Promise.race([
    new Promise<null>(
      (resolve) =>
        (timeout = setTimeout(() => {
          isTimeout = true;
          logger().error(`Can't connect to ${type.name()} playwright browser`, error);
          resolve(null);
        }, 10000)),
    ),
    (async () => {
      let browser: Browser | null = null;
      do {
        try {
          browser = await type.connect(gridUrl);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (timeout) clearTimeout(timeout);
          break;
        } catch (e: unknown) {
          error = e;
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } while (!isTimeout);
      return browser;
    })(),
  ]);
}

async function tryCreateBrowserContext(
  browser: Browser,
  options: BrowserContextOptions,
): Promise<{ context: BrowserContext; page: Page }> {
  try {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    return { context, page };
  } catch (error) {
    if (error instanceof Error && error.message.includes('ffmpeg')) {
      logger().warn('Failed to create browser context with video recording. Video recording will be disabled.');
      logger().warn(error);
      const context = await browser.newContext({
        ...options,
        recordVideo: undefined,
      });
      const page = await context.newPage();
      return { context, page };
    }
    throw error;
  }
}

export class InternalBrowser {
  #isShuttingDown = false;
  #browser: Browser;
  #context: BrowserContext;
  #page: Page;
  #traceDir: string;
  #sessionId: string = v4();
  #debug: boolean;
  #storybookGlobals?: StorybookGlobals;
  #shouldReinit = false;
  constructor(
    browser: Browser,
    context: BrowserContext,
    page: Page,
    traceDir: string,
    debug = false,
    storybookGlobals?: StorybookGlobals,
  ) {
    this.#browser = browser;
    this.#context = context;
    this.#page = page;
    this.#traceDir = traceDir;
    this.#debug = debug;
    this.#storybookGlobals = storybookGlobals;
  }

  // TODO Expose #browser and #context in tests
  get browser() {
    return this.#page;
  }

  get sessionId() {
    return this.#sessionId;
  }

  async closeBrowser(): Promise<void> {
    if (this.#isShuttingDown) return;

    this.#isShuttingDown = true;

    const teardown = [
      this.#debug ? () => this.#context.tracing.stop({ path: path.join(this.#traceDir, 'trace.zip') }) : null,
      () => this.#page.close(),
      this.#debug ? () => this.#page.video()?.saveAs(path.join(this.#traceDir, 'video.webm')) : null,
      () => this.#context.close(),
      () => this.#browser.close(),
      () => removeWorkerContainer(),
    ];

    for (const fn of teardown) {
      try {
        if (fn) await fn();
      } catch {
        /* noop */
      }
    }
  }

  async takeScreenshot(
    captureElement?: string | null,
    ignoreElements?: string | string[] | null,
    options?: PageScreenshotOptions,
  ): Promise<Buffer> {
    const ignore = Array.isArray(ignoreElements) ? ignoreElements : ignoreElements ? [ignoreElements] : [];
    const mask = ignore.map((el) => this.#page.locator(el));
    if (captureElement) {
      const element = await this.#page.$(captureElement);
      if (!element) throw new Error(`Element with selector ${captureElement} not found`);

      logger().debug(`Capturing ${chalk.cyan(captureElement)} element`);
      return element.screenshot({
        style: ':root { overflow: hidden !important; }',
        animations: 'disabled',
        mask,
        ...options,
      });
    }
    logger().debug('Capturing viewport screenshot');
    return this.#page.screenshot({ animations: 'disabled', mask, ...options });
  }

  async selectStory(id: string): Promise<void> {
    if (this.#shouldReinit) {
      this.#shouldReinit = false;
      const done = await this.initStorybook();
      if (!done) return;
    }

    await this.resetMousePosition();

    logger().debug(`Triggering 'SetCurrentStory' event with storyId ${chalk.magenta(id)}`);

    const reloadWatcher = this.#page.waitForFunction((id) => id !== window.__CREEVEY_SESSION_ID__, this.#sessionId);
    const selectWatcher = this.#page.waitForFunction(() => window.__CREEVEY_SELECT_STORY_RESULT__);

    void this.#page.evaluate<unknown, string>(selectStory, id);

    await Promise.race([reloadWatcher, selectWatcher]);

    let result = null;

    try {
      result = await this.#page.evaluate(() => window.__CREEVEY_SELECT_STORY_RESULT__);
    } catch (error) {
      // TODO: Debug why select watcher resolved, but we still fail with execution context destroyed
      // Maybe we need to wait for page to be fully loaded???
      if (error instanceof Error && error.message.includes('Execution context was destroyed')) {
        // Ignore error
      } else {
        throw error;
      }
    }

    if (!result) {
      logger().debug('Storybook page has been reloaded during story selection');
      const done = await this.initStorybook();
      if (!done) return;
    }

    if (result?.status === 'error') {
      throw new Error(`Failed to select story: ${result.message}`);
    }
  }

  async updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void> {
    await this.#page.evaluate(
      ([storyId, updatedArgs, UPDATE_STORY_ARGS, STORY_RENDERED]) => {
        return new Promise((resolve) => {
          // TODO Check if it's right way to wait for story to be rendered
          window.__STORYBOOK_ADDONS_CHANNEL__.once(STORY_RENDERED, resolve);
          window.__STORYBOOK_ADDONS_CHANNEL__.emit(UPDATE_STORY_ARGS, {
            storyId,
            updatedArgs,
          });
        });
      },
      [story.id, updatedArgs, StorybookEvents.UPDATE_STORY_ARGS, StorybookEvents.STORY_RENDERED] as const,
    );
  }

  async loadStoriesFromBrowser(): Promise<StoriesRaw> {
    // @ts-expect-error TODO: Fix this
    return await this.#page.evaluate(getStories);
  }

  static async getBrowser(
    browserName: string,
    gridUrl: string,
    config: Config,
    debug: boolean,
  ): Promise<InternalBrowser | null> {
    const browserConfig = config.browsers[browserName] as BrowserConfigObject;
    const {
      storybookUrl: address = config.storybookUrl,
      viewport,
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      _storybookGlobals,
      storybookGlobals = _storybookGlobals,
      seleniumCapabilities,
      playwrightOptions,
    } = browserConfig;
    const parsedUrl = new URL(gridUrl);
    const tracesDir = path.join(
      playwrightOptions?.tracesDir ?? path.join(config.reportDir, 'traces'),
      process.pid.toString(),
    );
    const cacheDir = await getCreeveyCache();

    assert(cacheDir, "Couldn't get cache directory");

    let browser: Browser | null = null;

    if (parsedUrl.protocol === 'ws:') {
      browser = await tryConnect(browsers[resolvePlaywrightBrowserType(browserConfig.browserName)], gridUrl);
    } else if (parsedUrl.protocol === 'creevey:') {
      browser = await browsers[resolvePlaywrightBrowserType(browserConfig.browserName)].launch({
        ...playwrightOptions,
        tracesDir: path.join(cacheDir, `${process.pid}`),
      });
    } else {
      if (browserConfig.browserName !== 'chrome') {
        logger().error("Playwright's Selenium Grid feature supports only chrome browser");
        return null;
      }

      process.env.SELENIUM_REMOTE_URL = gridUrl;
      process.env.SELENIUM_REMOTE_CAPABILITIES = JSON.stringify(seleniumCapabilities);

      browser = await chromium.launch({ ...playwrightOptions, tracesDir: path.join(cacheDir, `${process.pid}`) });
    }

    if (!browser) {
      return null;
    }

    const { context, page } = await tryCreateBrowserContext(browser, {
      recordVideo: debug
        ? {
            dir: path.join(cacheDir, `${process.pid}`),
            size: viewport,
          }
        : undefined,
      screen: viewport,
      viewport,
    });

    if (debug) {
      await context.tracing.start(
        Object.assign({ screenshots: true, snapshots: true, sources: true }, playwrightOptions?.trace),
      );
    }

    if (logger().getLevel() <= Logger.levels.DEBUG) {
      page.on('console', (msg) => {
        logger().debug(`Console message: ${msg.text()}`);
      });
    }

    const internalBrowser = new InternalBrowser(browser, context, page, tracesDir, debug, storybookGlobals);

    try {
      if (isShuttingDown.current) return null;
      const done = await internalBrowser.init({
        browserName,
        storybookUrl: address,
      });

      return done ? internalBrowser : null;
    } catch (originalError) {
      void internalBrowser.closeBrowser();

      const message = originalError instanceof Error ? originalError.message : (originalError as string);
      const error = new Error(`Can't load storybook root page: ${message}`);
      if (originalError instanceof Error) error.stack = originalError.stack;

      logger().error(error);

      return null;
    }
  }

  private async init({ browserName, storybookUrl }: { browserName: string; storybookUrl: string }) {
    const sessionId = this.#sessionId;

    prefix.apply(logger(), {
      format(level) {
        const levelColor = colors[level.toUpperCase() as keyof typeof colors];
        return `[${browserName}:${chalk.gray(process.pid)}] ${levelColor(level)} => ${chalk.gray(sessionId)}`;
      },
    });

    this.#page.setDefaultTimeout(60000);

    await this.#page.addInitScript(() => {
      requestAnimationFrame(check);

      function check() {
        if (
          document.readyState !== 'complete' ||
          typeof window.__STORYBOOK_PREVIEW__ === 'undefined' ||
          typeof window.__STORYBOOK_ADDONS_CHANNEL__ === 'undefined' ||
          window.__STORYBOOK_ADDONS_CHANNEL__.last('setGlobals') === undefined
        ) {
          requestAnimationFrame(check);
          return;
        }

        if ('ready' in window.__STORYBOOK_PREVIEW__) {
          // NOTE: Storybook <= 7.x doesn't have ready() method
          void window.__STORYBOOK_PREVIEW__.ready().then(() => (window.__CREEVYE_STORYBOOK_READY__ = true));
        } else {
          window.__CREEVYE_STORYBOOK_READY__ = true;
        }
      }
    });

    return await runSequence(
      [() => this.openStorybookPage(storybookUrl), () => this.initStorybook()],
      () => !this.#isShuttingDown,
    );
  }

  private async initStorybook() {
    await this.#page.evaluate((id) => (window.__CREEVEY_SESSION_ID__ = id), this.#sessionId);

    return await runSequence(
      [() => this.waitForStorybook(), () => this.defineGlobals(), () => this.loadStorybookStories()],
      () => !this.#isShuttingDown,
    );
  }

  private async openStorybookPage(storybookUrl: string): Promise<void> {
    if (!LOCALHOST_REGEXP.test(storybookUrl)) {
      await this.#page.goto(appendIframePath(storybookUrl));
      return;
    }

    try {
      const resolvedUrl = await resolveStorybookUrl(appendIframePath(storybookUrl), (url) => this.checkUrl(url));
      await this.#page.goto(resolvedUrl);
    } catch (error) {
      logger().error('Failed to resolve storybook URL', error instanceof Error ? error.message : '');
      throw error;
    }
  }

  private async checkUrl(url: string): Promise<boolean> {
    const page = await this.#browser.newPage();
    try {
      logger().debug(`Opening ${chalk.magenta(url)} and checking the page source`);
      const response = await page.goto(url, { waitUntil: 'commit' });
      const source = await response?.text();

      logger().debug(`Checking ${chalk.cyan(`#${storybookRootID}`)} existence on ${chalk.magenta(url)}`);
      return source?.includes(`id="${storybookRootID}"`) ?? false;
    } catch {
      return false;
    } finally {
      await page.close();
    }
  }

  private async waitForStorybook(): Promise<void> {
    logger().debug('Waiting for Storybook to initiate');

    await this.#page.waitForFunction(() => window.__CREEVYE_STORYBOOK_READY__);
  }

  private async loadStorybookStories(): Promise<void> {
    logger().debug('Loading Storybook stories');

    const storiesWatcher = this.#page.waitForFunction(() => window.__CREEVEY_STORYBOOK_STORIES__);
    const reloadWatcher = this.#page.waitForFunction((id) => id !== window.__CREEVEY_SESSION_ID__, this.#sessionId);

    void this.#page.evaluate(() => {
      void window.__STORYBOOK_PREVIEW__.extract().then((stories) => {
        window.__CREEVEY_STORYBOOK_STORIES__ = stories;
      });
    });

    const type = await Promise.race([storiesWatcher.then(() => 'stories'), reloadWatcher.then(() => 'reload')]);

    if (type === 'reload') {
      logger().debug('Storybook page reloaded');
      await this.waitForStorybook();
    }
  }

  private async resetMousePosition(): Promise<void> {
    logger().debug('Resetting mouse position to (0, 0)');
    await this.#page.mouse.move(0, 0);
  }

  private async defineGlobals(): Promise<void> {
    logger().debug('Defining Storybook globals');
    const globalsWatcher = this.#page.waitForFunction(() => window.__CREEVEY_STORYBOOK_GLOBALS__);

    void this.#page.evaluate((userGlobals) => {
      // @ts-expect-error https://github.com/evanw/esbuild/issues/2605#issuecomment-2050808084
      window.__name = (func: unknown) => func;
      if (userGlobals) {
        window.__STORYBOOK_ADDONS_CHANNEL__.once('globalsUpdated', ({ globals }: { globals: StorybookGlobals }) => {
          window.__CREEVEY_STORYBOOK_GLOBALS__ = globals;
        });
        window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: userGlobals });
      } else {
        window.__CREEVEY_STORYBOOK_GLOBALS__ = {};
      }
    }, this.#storybookGlobals);

    await globalsWatcher;
  }
}
