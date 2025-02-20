import { Browser, BrowserType, Page, chromium, firefox, webkit } from 'playwright-core';
import chalk from 'chalk';
import { v4 } from 'uuid';
import prefix from 'loglevel-plugin-prefix';
import {
  BrowserConfigObject,
  Config,
  Options,
  StoriesRaw,
  StoryInput,
  StorybookEvents,
  StorybookGlobals,
  noop,
} from '../../types';
import { subscribeOn } from '../messages';
import { appendIframePath, getAddresses, LOCALHOST_REGEXP, resolveStorybookUrl, storybookRootID } from '../webdriver';
import { isShuttingDown, resolvePlaywrightBrowserType, runSequence } from '../utils';
import { colors, logger } from '../logger';
import type { Args } from '@storybook/csf';

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

export class InternalBrowser {
  #isShuttingDown = false;
  #browser: Browser;
  #page: Page;
  #sessionId: string = v4();
  #serverHost: string | null = null;
  #serverPort: number;
  #storybookGlobals?: StorybookGlobals;
  #unsubscribe: () => void = noop;
  constructor(browser: Browser, page: Page, port: number, storybookGlobals?: StorybookGlobals) {
    this.#browser = browser;
    this.#page = page;
    this.#serverPort = port;
    this.#storybookGlobals = storybookGlobals;
    this.#unsubscribe = subscribeOn('shutdown', () => {
      void this.closeBrowser();
    });
  }

  get browser() {
    return this.#page;
  }

  get sessionId() {
    return this.#sessionId;
  }

  async closeBrowser(): Promise<void> {
    if (this.#isShuttingDown) return;

    this.#isShuttingDown = true;
    this.#unsubscribe();

    try {
      await this.#page.close();
      await this.#browser.close();
    } catch (_) {
      /* noop */
    }
  }

  async takeScreenshot(captureElement?: string | null, ignoreElements?: string | string[] | null): Promise<Buffer> {
    // TODO Implement features from selenium `takeScreenshot`
    // TODO Do we need scroll bar hack from selenium?
    const ignore = Array.isArray(ignoreElements) ? ignoreElements : ignoreElements ? [ignoreElements] : [];
    const mask = ignore.map((el) => this.#page.locator(el));
    if (captureElement) {
      const element = await this.#page.$(captureElement);
      if (!element) throw new Error(`Element with selector ${captureElement} not found`);

      return element.screenshot({
        animations: 'disabled',
        mask,
        style: ':root { overflow: hidden !important; }',
      });
    }
    return this.#page.screenshot({ animations: 'disabled', mask, fullPage: true });
  }

  waitForComplete(callback: (isCompleted: boolean) => void): void {
    void this.#page.evaluate<boolean>(() => window.__CREEVEY_HAS_PLAY_COMPLETED_YET__()).then(callback);
  }

  async selectStory(id: string, waitForReady = false): Promise<boolean> {
    // NOTE: Global variables might be reset after hot reload. I think it's workaround, maybe we need better solution
    await this.updateStorybookGlobals();
    await this.updateBrowserGlobalVariables();
    await this.resetMousePosition();

    logger().debug(`Triggering 'SetCurrentStory' event with storyId ${chalk.magenta(id)}`);

    const result = await this.#page.evaluate<
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
      [id, waitForReady],
    );

    const [errorMessage, isCaptureCalled = false] = result ?? [];

    if (errorMessage) throw new Error(errorMessage);

    return isCaptureCalled;
  }

  async updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void> {
    await this.#page.evaluate(
      ([storyId, updatedArgs, UPDATE_STORY_ARGS, STORY_RENDERED]) => {
        return new Promise((resolve) => {
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
    const stories = await this.#page.evaluate<StoriesRaw | undefined>(() => window.__CREEVEY_GET_STORIES__());

    if (!stories) throw new Error("Can't get stories, it seems creevey or storybook API isn't available");

    return stories;
  }

  static async getBrowser(
    browserName: string,
    gridUrl: string,
    config: Config,
    options: Options,
  ): Promise<InternalBrowser | null> {
    const browserConfig = config.browsers[browserName] as BrowserConfigObject;
    const {
      storybookUrl: address = config.storybookUrl,
      viewport,
      _storybookGlobals,
      seleniumCapabilities,
      playwrightOptions,
    } = browserConfig;

    let browser: Browser | null = null;

    const parsedUrl = new URL(gridUrl);
    if (parsedUrl.protocol === 'ws:') {
      browser = await tryConnect(browsers[resolvePlaywrightBrowserType(browserConfig.browserName)], gridUrl);
    } else if (parsedUrl.protocol === 'creevey:') {
      browser = await browsers[resolvePlaywrightBrowserType(browserConfig.browserName)].launch(playwrightOptions);
    } else {
      if (browserConfig.browserName !== 'chrome') {
        logger().error("Playwright's Selenium Grid feature supports only chrome browser");
        return null;
      }

      process.env.SELENIUM_REMOTE_URL = gridUrl;
      process.env.SELENIUM_REMOTE_CAPABILITIES = JSON.stringify(seleniumCapabilities);

      browser = await chromium.launch(playwrightOptions);
    }

    if (!browser) {
      return null;
    }

    // TODO Record video
    const page = await browser.newPage();
    // TODO Support tracing
    // if (playwrightOptions?.trace) {
    //   const context = page.context();
    //   await context.tracing.start(playwrightOptions.trace);
    // }

    // TODO Add debug output

    const internalBrowser = new InternalBrowser(browser, page, options.port, _storybookGlobals);

    try {
      if (isShuttingDown.current) return null;
      const done = await internalBrowser.init({
        browserName,
        viewport,
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

  private async init({
    browserName,
    viewport,
    storybookUrl,
  }: {
    browserName: string;
    viewport?: { width: number; height: number };
    storybookUrl: string;
  }) {
    const sessionId = this.#sessionId;

    prefix.apply(logger(), {
      format(level) {
        const levelColor = colors[level.toUpperCase() as keyof typeof colors];
        return `[${browserName}:${chalk.gray(process.pid)}] ${levelColor(level)} => ${chalk.gray(sessionId)}`;
      },
    });

    this.#page.setDefaultTimeout(60000);

    return await runSequence(
      [
        () => this.openStorybookPage(storybookUrl),
        () => this.waitForStorybook(),
        () => this.triggerViteReload(),
        () => this.updateStorybookGlobals(),
        () => this.resolveCreeveyHost(),
        () => this.updateBrowserGlobalVariables(),
        () => this.resizeViewport(viewport),
      ],
      () => !this.#isShuttingDown,
    );
  }

  private async openStorybookPage(storybookUrl: string): Promise<void> {
    if (!LOCALHOST_REGEXP.test(storybookUrl)) {
      await this.#page.goto(appendIframePath(storybookUrl));
      return;
    }

    try {
      // TODO this.#page.setDefaultNavigationTimeout(60000);
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
    // TODO Duplicated code with selenium
    logger().debug('Waiting for `setStories` event to make sure that storybook is initiated');

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
            // TODO Maybe use `__STORYBOOK_PREVIEW__.extract()`
            wait = await this.#page.evaluate((SET_GLOBALS: string) => {
              if (typeof window.__STORYBOOK_ADDONS_CHANNEL__ == 'undefined') return true;
              if (window.__STORYBOOK_ADDONS_CHANNEL__.last(SET_GLOBALS) == undefined) return true;
              return false;
            }, StorybookEvents.SET_GLOBALS);
          } catch (e: unknown) {
            logger().debug('An error has been caught during the script:', e);
          }
          if (wait) await new Promise((resolve) => setTimeout(resolve, 1000));
        } while (wait);
        return false;
      })(),
    ]);

    // TODO Change the message to describe a reason why it might happen
    if (isTimeout) throw new Error('Failed to wait `setStories` event');
  }

  private async triggerViteReload(): Promise<void> {
    // NOTE: On the first load, Vite might try to optimize some dependencies and reload the page
    // We need to trigger reload earlier to avoid unnecessary reloads further
    try {
      await this.#page.evaluate(async () => {
        await window.__STORYBOOK_PREVIEW__.extract();
      });
    } catch {
      await this.waitForStorybook();
    }
  }

  private async updateStorybookGlobals(): Promise<void> {
    if (!this.#storybookGlobals) return;

    logger().debug('Applying storybook globals');
    await this.#page.evaluate((globals: StorybookGlobals) => {
      window.__CREEVEY_UPDATE_GLOBALS__(globals);
    }, this.#storybookGlobals);
  }

  private async resolveCreeveyHost(): Promise<void> {
    const addresses = getAddresses();

    this.#serverHost = await this.#page.evaluate(
      ([hosts, port]) => {
        return Promise.all(
          hosts.map((host) => {
            return Promise.race([
              // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
              fetch('http://' + host + ':' + port + '/ping').then((response) => response.text()),
              new Promise((_resolve, reject) => {
                setTimeout(reject, 5000);
              }),
            ])
              .then((pong) => (pong == 'pong' ? host : null))
              .catch(() => null);
          }),
        ).then((hosts) => hosts.find((host) => host != null) ?? null);
      },
      [addresses, this.#serverPort] as const,
    );

    if (this.#serverHost == null) throw new Error("Can't reach creevey server from a browser");
  }

  private async updateBrowserGlobalVariables() {
    logger().debug('Updating browser global variables');
    await this.#page.evaluate(
      ([workerId, creeveyHost, creeveyPort]) => {
        window.__CREEVEY_ENV__ = true;
        window.__CREEVEY_WORKER_ID__ = workerId;
        window.__CREEVEY_SERVER_HOST__ = creeveyHost ?? 'localhost';
        window.__CREEVEY_SERVER_PORT__ = creeveyPort;
      },
      [process.pid, this.#serverHost, this.#serverPort] as const,
    );
  }

  private async resizeViewport(viewport?: { width: number; height: number }): Promise<void> {
    if (!viewport) return;

    logger().debug('Resizing viewport to', viewport);
    await this.#page.setViewportSize(viewport);
  }

  private async resetMousePosition(): Promise<void> {
    logger().debug('Resetting mouse position to (0, 0)');
    await this.#page.mouse.move(0, 0);
  }
}
