import path from 'path';
import { Browser, BrowserContext, BrowserType, Page, chromium, firefox, webkit } from 'playwright-core';
import chalk from 'chalk';
import { v4 } from 'uuid';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import type { Args } from '@storybook/csf';
import {
  BrowserConfigObject,
  Config,
  Options,
  StoriesRaw,
  StoryInput,
  StorybookEvents,
  StorybookGlobals,
} from '../../types';
import {
  appendIframePath,
  getAddresses,
  LOCALHOST_REGEXP,
  openBrowser,
  resolveStorybookUrl,
  storybookRootID,
} from '../webdriver';
import { getCreeveyCache, isShuttingDown, resolvePlaywrightBrowserType, runSequence } from '../utils';
import { colors, logger } from '../logger';
import assert from 'assert';

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
  #context: BrowserContext;
  #page: Page;
  #traceDir: string;
  #sessionId: string = v4();
  #serverHost: string | null = null;
  #serverPort: number;
  #debug: boolean;
  #storybookGlobals?: StorybookGlobals;
  #closeBrowser = openBrowser();
  constructor(
    browser: Browser,
    context: BrowserContext,
    page: Page,
    traceDir: string,
    port: number,
    debug: boolean,
    storybookGlobals?: StorybookGlobals,
  ) {
    this.#browser = browser;
    this.#context = context;
    this.#page = page;
    this.#traceDir = traceDir;
    this.#serverPort = port;
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

    try {
      if (this.#debug) await this.#context.tracing.stop({ path: path.join(this.#traceDir, 'trace.zip') });
      await this.#page.close();
      if (this.#debug) await this.#page.video()?.saveAs(path.join(this.#traceDir, 'video.webm'));
      await this.#context.close();
      await this.#browser.close();
    } catch {
      /* noop */
    } finally {
      this.#closeBrowser();
    }
  }

  async takeScreenshot(captureElement?: string | null, ignoreElements?: string | string[] | null): Promise<Buffer> {
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

    const context = await browser.newContext({
      recordVideo: options.debug
        ? {
            dir: path.join(cacheDir, `${process.pid}`),
            size: viewport,
          }
        : undefined,
      screen: viewport,
      viewport,
    });
    const page = await context.newPage();
    if (options.debug) {
      await context.tracing.start(
        Object.assign({ screenshots: true, snapshots: true, sources: true }, playwrightOptions?.trace),
      );
    }

    if (logger().getLevel() <= Logger.levels.DEBUG) {
      page.on('console', (msg) => {
        logger().debug(`Console message: ${msg.text()}`);
      });
    }

    const internalBrowser = new InternalBrowser(
      browser,
      context,
      page,
      tracesDir,
      options.port,
      options.debug,
      _storybookGlobals,
    );

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

    return await runSequence(
      [
        () => this.openStorybookPage(storybookUrl),
        () => this.waitForStorybook(),
        () => this.triggerViteReload(),
        () => this.updateStorybookGlobals(),
        () => this.resolveCreeveyHost(),
        () => this.updateBrowserGlobalVariables(),
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
            logger().debug('An error has been caught during the script:', e);
            if (this.#page.isClosed()) throw e;
          }
          if (wait) await new Promise((resolve) => setTimeout(resolve, 1000));
        } while (wait);
        return false;
      })(),
    ]);

    if (isTimeout) throw new Error('Failed to wait Storybook init');
  }

  // TODO Doesn't work for some reason, maybe because of race-condition
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

  private async resetMousePosition(): Promise<void> {
    logger().debug('Resetting mouse position to (0, 0)');
    await this.#page.mouse.move(0, 0);
  }
}
