import { Browser, BrowserType, Page, chromium, firefox, webkit } from 'playwright-core';
import Logger from 'loglevel';
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
import { isShuttingDown, runSequence } from '../utils';
import { colors, logger } from '../logger';
import { Args } from '@storybook/csf';

async function tryConnect(type: BrowserType, gridUrl: string): Promise<Browser | null> {
  let timeout: NodeJS.Timeout | null = null;
  let isTimeout = false;
  let error: unknown = null;
  return Promise.race([
    new Promise<null>(
      (resolve) =>
        (timeout = setTimeout(() => {
          isTimeout = true;
          logger.error(`Can't connect to ${type.name()} playwright browser`, error);
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
  #logger: Logger.Logger;
  #unsubscribe: () => void = noop;
  constructor(browser: Browser, page: Page, port: number) {
    this.#browser = browser;
    this.#page = page;
    this.#serverPort = port;
    this.#logger = Logger.getLogger(this.#sessionId);
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
      return element.screenshot({ animations: 'disabled', mask });
    }
    return this.#page.screenshot({ animations: 'disabled', mask, fullPage: true });
  }

  waitForComplete(callback: (isCompleted: boolean) => void): void {
    void this.#page.evaluate<boolean>(() => window.__CREEVEY_HAS_PLAY_COMPLETED_YET__()).then(callback);
  }

  async selectStory(id: string, waitForReady = false): Promise<boolean> {
    // NOTE: Global variables might be reset after hot reload. I think it's workaround, maybe we need better solution
    await this.updateBrowserGlobalVariables();
    await this.resetMousePosition();

    this.#logger.debug(`Triggering 'SetCurrentStory' event with storyId ${chalk.magenta(id)}`);

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

  async loadStoriesFromBrowser(retry = false): Promise<StoriesRaw> {
    try {
      const stories = await this.#page.evaluate<StoriesRaw | undefined>(() => window.__CREEVEY_GET_STORIES__());

      if (!stories) throw new Error("Can't get stories, it seems creevey or storybook API isn't available");

      return stories;
    } catch (error) {
      // TODO Check how other solutions with playwright get stories from storybook
      if (retry) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // NOTE: Try one more time because of dynamic nature of vite and storybook
      return this.loadStoriesFromBrowser(true);
    }
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
      ...userCapabilities
    } = browserConfig;

    let browser: Browser | null = null;

    if (new URL(gridUrl).protocol === 'ws:') {
      switch (browserConfig.browserName) {
        case 'chromium':
          browser = await tryConnect(chromium, gridUrl);
          break;
        case 'firefox':
          browser = await tryConnect(firefox, gridUrl);
          break;
        case 'webkit':
          browser = await tryConnect(webkit, gridUrl);
          break;

        default:
          logger.error(
            `Unknown browser ${browserConfig.browserName}. Playwright supports browsers: chromium, firefox, webkit`,
          );
      }
    } else {
      if (browserConfig.browserName != 'chrome') {
        logger.error("Playwright's Selenium Grid feature supports only chrome browser");
        return null;
      }

      process.env.SELENIUM_REMOTE_URL = gridUrl;
      process.env.SELENIUM_REMOTE_CAPABILITIES = JSON.stringify(userCapabilities);

      browser = await chromium.launch();
    }

    if (!browser) {
      return null;
    }

    const page = await browser.newPage();

    // TODO Add debug output

    const internalBrowser = new InternalBrowser(browser, page, options.port);

    try {
      if (isShuttingDown.current) return null;
      const done = await internalBrowser.init({
        browserName,
        viewport,
        storybookUrl: address,
        storybookGlobals: _storybookGlobals,
        resolveStorybookUrl: config.resolveStorybookUrl,
      });

      return done ? internalBrowser : null;
    } catch (originalError) {
      void internalBrowser.closeBrowser();

      const message = originalError instanceof Error ? originalError.message : (originalError as string);
      const error = new Error(`Can't load storybook root page: ${message}`);
      if (originalError instanceof Error) error.stack = originalError.stack;

      logger.error(error);

      return null;
    }
  }

  private async init({
    browserName,
    viewport,
    storybookUrl,
    storybookGlobals,
    resolveStorybookUrl,
  }: {
    browserName: string;
    viewport?: { width: number; height: number };
    storybookUrl: string;
    storybookGlobals?: StorybookGlobals;
    resolveStorybookUrl?: () => Promise<string>;
  }) {
    const sessionId = this.#sessionId;

    prefix.apply(this.#logger, {
      format(level) {
        const levelColor = colors[level.toUpperCase() as keyof typeof colors];
        return `[${browserName}:${chalk.gray(sessionId)}] ${levelColor(level)} =>`;
      },
    });

    this.#page.setDefaultNavigationTimeout(10000);
    this.#page.setDefaultTimeout(60000);

    return await runSequence(
      [
        () => this.openStorybookPage(storybookUrl, resolveStorybookUrl),
        () => this.waitForStorybook(),
        () => this.updateStorybookGlobals(storybookGlobals),
        () => this.resolveCreeveyHost(),
        () => this.updateBrowserGlobalVariables(),
        () => this.resizeViewport(viewport),
      ],
      () => !this.#isShuttingDown,
    );
  }

  private async openStorybookPage(storybookUrl: string, resolver?: () => Promise<string>): Promise<void> {
    if (!LOCALHOST_REGEXP.test(storybookUrl)) {
      await this.#page.goto(appendIframePath(storybookUrl));
      return;
    }

    try {
      if (resolver) {
        this.#logger.debug('Resolving storybook url with custom resolver');

        const resolvedUrl = await resolver();

        this.#logger.debug(`Resolver storybook url ${resolvedUrl}`);

        await this.#page.goto(appendIframePath(resolvedUrl));
      } else {
        await resolveStorybookUrl(appendIframePath(storybookUrl), (url) => this.checkUrl(url), this.#logger);
      }
    } catch (error) {
      this.#logger.error('Failed to resolve storybook URL', error instanceof Error ? error.message : '');
      throw error;
    }
  }

  private async checkUrl(url: string): Promise<boolean> {
    try {
      this.#logger.debug(`Opening ${chalk.magenta(url)} and checking the page source`);
      const response = await this.#page.goto(url, { waitUntil: 'commit' });
      const source = await response?.text();

      this.#logger.debug(`Checking ${chalk.cyan(`#${storybookRootID}`)} existence on ${chalk.magenta(url)}`);
      return source?.includes(`id="${storybookRootID}"`) ?? false;
    } catch {
      return false;
    }
  }

  private async waitForStorybook(): Promise<void> {
    // TODO Duplicated code with selenium
    this.#logger.debug('Waiting for `setStories` event to make sure that storybook is initiated');

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
            wait = await this.#page.evaluate((SET_GLOBALS: string) => {
              if (typeof window.__STORYBOOK_ADDONS_CHANNEL__ == 'undefined') return true;
              if (window.__STORYBOOK_ADDONS_CHANNEL__.last(SET_GLOBALS) == undefined) return true;
              return false;
            }, StorybookEvents.SET_GLOBALS);
          } catch (e: unknown) {
            this.#logger.debug('An error has been caught during the script:', e);
          }
        } while (wait);
        return false;
      })(),
    ]);

    // TODO Change the message to describe a reason why it might happen
    if (isTimeout) throw new Error('Failed to wait `setStories` event');
  }

  private async updateStorybookGlobals(globals?: StorybookGlobals): Promise<void> {
    if (!globals) return;

    this.#logger.debug('Applying storybook globals');
    await this.#page.evaluate((globals: StorybookGlobals) => {
      window.__CREEVEY_UPDATE_GLOBALS__(globals);
    }, globals);
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
    await this.#page.evaluate(
      ([workerId, creeveyHost, creeveyPort]) => {
        window.__CREEVEY_WORKER_ID__ = workerId;
        window.__CREEVEY_SERVER_HOST__ = creeveyHost ?? 'localhost';
        window.__CREEVEY_SERVER_PORT__ = creeveyPort;
      },
      [process.pid, this.#serverHost, this.#serverPort] as const,
    );
  }

  private async resizeViewport(viewport?: { width: number; height: number }): Promise<void> {
    if (!viewport) return;

    await this.#page.setViewportSize(viewport);
  }

  private async resetMousePosition(): Promise<void> {
    await this.#page.mouse.move(0, 0);
  }
}
