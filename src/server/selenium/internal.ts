import type { Args } from 'storybook/internal/types';
import chalk from 'chalk';
import http from 'http';
import https from 'https';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import { PNG } from 'pngjs';
import { Builder, By, Capabilities, Origin, WebDriver, WebElement, logging } from 'selenium-webdriver';
// import { Options as IeOptions } from 'selenium-webdriver/ie';
// import { Options as EdgeOptions } from 'selenium-webdriver/edge';
// import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
// import { Options as SafariOptions } from 'selenium-webdriver/safari';
// import { Options as FirefoxOptions } from 'selenium-webdriver/firefox';
import { PageLoadStrategy } from 'selenium-webdriver/lib/capabilities.js';
import {
  BrowserConfigObject,
  Config,
  noop,
  StorybookGlobals,
  StoryInput,
  StoriesRaw,
  StorybookEvents,
} from '../../types.js';
import { colors, logger } from '../logger.js';
import { emitWorkerMessage, subscribeOn } from '../messages.js';
import { isShuttingDown, runSequence } from '../utils.js';
import { appendIframePath, LOCALHOST_REGEXP, resolveStorybookUrl, storybookRootID } from '../webdriver.js';
import { getStories, insertIgnoreStyles, removeIgnoreStyles, selectStory } from '../storybook-helpers.js';

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// type UnPromise<P> = P extends Promise<infer T> ? T : never;
// let context: UnPromise<ReturnType<typeof BrowsingContext>> | null = null;

function getSessionData(grid: string, sessionId = ''): Promise<Record<string, unknown>> {
  const gridUrl = new URL(grid);
  gridUrl.pathname = `/host/${sessionId}`;

  return new Promise((resolve, reject) =>
    (gridUrl.protocol == 'https:' ? https : http).get(gridUrl.toString(), (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Couldn't get session data for ${sessionId}. Status code: ${res.statusCode ?? 'Unknown'}`));
        return;
      }

      let data = '';

      res.setEncoding('utf-8');
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as Record<string, unknown>);
        } catch (error) {
          reject(
            new Error(
              `Couldn't get session data for ${sessionId}. ${
                error instanceof Error ? (error.stack ?? error.message) : (error as string)
              }`,
            ),
          );
        }
      });
    }),
  );
}

async function openUrlAndWaitForPageSource(
  browser: WebDriver,
  url: string,
  predicate: (source: string) => boolean,
): Promise<string> {
  let source = '';
  await browser.get(url);
  do {
    try {
      source = await browser.getPageSource();
    } catch {
      // NOTE: Firefox can raise exception "curContainer.frame.document.documentElement is null"
    }
  } while (predicate(source));
  return source;
}

async function buildWebdriver(
  browser: string,
  gridUrl: string,
  config: Config,
  debug: boolean,
): Promise<WebDriver | null> {
  const browserConfig = config.browsers[browser] as BrowserConfigObject;
  const { /*customizeBuilder,*/ seleniumCapabilities, browserName } = browserConfig;

  const url = new URL(gridUrl);
  url.username = url.username ? '********' : '';
  url.password = url.password ? '********' : '';
  logger().debug(`Connecting to Selenium ${chalk.magenta(url.toString())}`);

  // TODO Define some capabilities explicitly and define typings
  const capabilities = new Capabilities({
    browserName,
    ...seleniumCapabilities,
    pageLoadStrategy: PageLoadStrategy.EAGER,
  });
  const prefs = new logging.Preferences();

  if (debug) {
    for (const type of Object.values(logging.Type)) {
      prefs.setLevel(type as string, logging.Level.ALL);
    }
  }

  // TODO Fetch selenium grid capabilities
  // TODO Validate browsers, versions, and platform
  // TODO Use `customizeBuilder`

  let webdriver: WebDriver | null;

  try {
    const maxRetries = 5;
    let retries = 0;
    do {
      webdriver = await Promise.race([
        new Promise<null>((resolve) => {
          setTimeout(() => {
            retries += 1;
            resolve(null);
          }, 120_000);
        }),
        (async () => {
          if (retries > 0) {
            logger().debug(`Trying to initialize session to Selenium Grid: retried ${retries} of ${maxRetries}`);
          }
          const retry = retries;
          // const ie = new IeOptions();
          // const edge = new EdgeOptions();
          // const chrome = new ChromeOptions();
          // const safari = new SafariOptions();
          // const firefox = new FirefoxOptions();
          // edge.enableBidi();
          // chrome.enableBidi();
          // firefox.enableBidi();

          const driver = await new Builder()
            // .setIeOptions(ie)
            // .setEdgeOptions(edge)
            // .setChromeOptions(chrome)
            // .setSafariOptions(safari)
            // .setFirefoxOptions(firefox)
            .usingServer(gridUrl)
            .withCapabilities(capabilities)
            .setLoggingPrefs(prefs) // NOTE: Should go last
            .build();

          // const id = await driver.getWindowHandle();
          // context = await BrowsingContext(driver, { browsingContextId: id });

          if (retry != retries) {
            void driver.quit().catch(() => {
              /* noop */
            });
            return null;
          }

          return driver;
        })(),
      ]);
      if (webdriver) break;
    } while (retries < maxRetries);

    if (!webdriver) throw new Error('Failed to initialize session to Selenium Grid due to many retries');
  } catch (error) {
    logger().error(`Failed to start browser:`, error);
    return null;
  }

  return webdriver;
}

export class InternalBrowser {
  #isShuttingDown = false;
  #browser: WebDriver;
  #storybookGlobals?: StorybookGlobals;
  #unsubscribe: () => void = noop;
  #keepAliveInterval: NodeJS.Timeout | null = null;
  #sessionId = '';
  constructor(browser: WebDriver, storybookGlobals?: StorybookGlobals) {
    this.#browser = browser;
    this.#storybookGlobals = storybookGlobals;
    this.#unsubscribe = subscribeOn('shutdown', () => {
      void this.closeBrowser();
    });
  }

  get browser() {
    return this.#browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.#isShuttingDown) return;

    this.#isShuttingDown = true;
    this.#unsubscribe();
    if (this.#keepAliveInterval !== null) clearInterval(this.#keepAliveInterval);

    try {
      await this.#browser.quit();
    } catch {
      /* noop */
    }
  }

  async takeScreenshot(captureElement?: string | null, ignoreElements?: string | string[] | null): Promise<Buffer> {
    let screenshot: string | Buffer;

    const ignoreStyles = await this.insertIgnoreStyles(ignoreElements);

    if (logger().getLevel() <= Logger.levels.DEBUG) {
      const { innerWidth, innerHeight } = await this.#browser.executeScript<{
        innerWidth: number;
        innerHeight: number;
      }>(function () {
        return {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        };
      });
      logger().debug(`Viewport size is: ${innerWidth}x${innerHeight}`);
    }

    try {
      if (!captureElement) {
        logger().debug('Capturing viewport screenshot');
        screenshot = await this.#browser.takeScreenshot();
        logger().debug('Viewport screenshot is captured');
      } else {
        logger().debug(`Checking is element ${chalk.cyan(captureElement)} fit into viewport`);
        const rects = await this.#browser.executeScript<
          { elementRect: ElementRect; windowRect: ElementRect } | undefined
        >(function (selector: string): { elementRect: ElementRect; windowRect: ElementRect } | undefined {
          window.scrollTo(0, 0);
          // eslint-disable-next-line no-var
          var element = document.querySelector(selector);
          if (!element) return;

          // eslint-disable-next-line no-var
          var elementRect = element.getBoundingClientRect();

          return {
            elementRect: {
              top: elementRect.top,
              left: elementRect.left,
              width: elementRect.width,
              height: elementRect.height,
            },
            // NOTE page_Offset is used only for IE9-11
            windowRect: {
              top: Math.round(window.scrollY || window.pageYOffset),
              left: Math.round(window.scrollX || window.pageXOffset),
              width: window.innerWidth,
              height: window.innerHeight,
            },
          };
        }, captureElement);
        const { elementRect, windowRect } = rects ?? {};

        if (!elementRect || !windowRect) throw new Error(`Couldn't find element with selector: '${captureElement}'`);

        const isFitIntoViewport =
          elementRect.width + elementRect.left <= windowRect.width &&
          elementRect.height + elementRect.top <= windowRect.height;

        if (isFitIntoViewport) {
          logger().debug(
            `Capturing ${chalk.cyan(captureElement)} with size: ${elementRect.width}x${elementRect.height}`,
          );
        } else
          logger().debug(
            `Capturing composite screenshot image of ${chalk.cyan(captureElement)} with size: ${elementRect.width}x${elementRect.height}`,
          );

        // const element = await browser.findElement(By.css(captureElement));
        // screenshot = isFitIntoViewport
        //   ? context
        //     ? await context.captureElementScreenshot(await element.getId())
        //     : await browser.findElement(By.css(captureElement)).takeScreenshot()
        //   : await takeCompositeScreenshot(browser, windowRect, elementRect);
        screenshot = isFitIntoViewport
          ? await this.#browser.findElement(By.css(captureElement)).takeScreenshot()
          : await this.takeCompositeScreenshot(windowRect, elementRect);

        logger().debug(`${chalk.cyan(captureElement)} is captured`);
      }
    } finally {
      await this.removeIgnoreStyles(ignoreStyles);
    }

    return typeof screenshot === 'string' ? Buffer.from(screenshot, 'base64') : screenshot;
  }

  async selectStory(id: string): Promise<void> {
    const sessionId = await this.#browser.executeScript(() => window.__CREEVEY_SESSION_ID__);
    if (sessionId !== this.#sessionId) {
      const done = await this.initStorybook();
      if (!done) return;
    }

    await this.resetMousePosition();

    logger().debug(`Triggering 'SetCurrentStory' event with storyId ${chalk.magenta(id)}`);

    void this.#browser.executeScript<string | null>(selectStory, id).catch(() => {
      /* noop */
    });

    let isWaitingForStory = true;
    const result = await Promise.race([
      new Promise<{ type: 'timeout' }>((resolve) => {
        setTimeout(() => {
          isWaitingForStory = false;
          resolve({ type: 'timeout' });
        }, 60000);
      }),
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (isWaitingForStory) {
          const [selectResult, sessionId] = await this.#browser.executeScript<
            [typeof window.__CREEVEY_SELECT_STORY_RESULT__, typeof window.__CREEVEY_SESSION_ID__]
          >(() => [window.__CREEVEY_SELECT_STORY_RESULT__, window.__CREEVEY_SESSION_ID__]);
          if (selectResult) return { type: 'select', ...selectResult } as const;
          if (sessionId !== this.#sessionId) return { type: 'reload' } as const;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return { type: 'timeout' } as const;
      })(),
    ]);

    if (result.type === 'timeout') throw new Error('Story selection timed out');
    if (result.type === 'reload') {
      logger().debug('Storybook page has been reloaded during story selection');
      const done = await this.initStorybook();
      if (!done) return;
    }
    if (result.type === 'select' && result.status === 'error') {
      throw new Error(`Failed to select story: ${result.message}`);
    }
  }

  async updateStoryArgs(story: StoryInput, updatedArgs: Args): Promise<void> {
    await this.#browser.executeAsyncScript<undefined>(
      function (
        storyId: string,
        updatedArgs: Args,
        UPDATE_STORY_ARGS: string,
        STORY_RENDERED: string,
        callback: () => void,
      ) {
        window.__STORYBOOK_ADDONS_CHANNEL__.once(STORY_RENDERED, callback);
        window.__STORYBOOK_ADDONS_CHANNEL__.emit(UPDATE_STORY_ARGS, {
          storyId,
          updatedArgs,
        });
      },
      story.id,
      updatedArgs,
      StorybookEvents.UPDATE_STORY_ARGS,
      StorybookEvents.STORY_RENDERED,
    );
  }

  async loadStoriesFromBrowser(): Promise<StoriesRaw> {
    return await this.#browser.executeAsyncScript(getStories);
  }

  async afterTest(): Promise<void> {
    if (logger().getLevel() <= Logger.levels.DEBUG) {
      const logs = await this.#browser.manage().logs().get('browser');

      for (const log of logs) {
        logger().debug(`Console message: ${new Date(log.timestamp).toISOString()} - ${log.message}`);
      }
    }
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
      limit,
      viewport,
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      _storybookGlobals,
      storybookGlobals = _storybookGlobals,
    } = browserConfig;
    void limit;

    const browser = await buildWebdriver(browserName, gridUrl, config, debug);

    if (!browser) return null;

    const internalBrowser = new InternalBrowser(browser, storybookGlobals);

    try {
      if (isShuttingDown.current) return null;

      const done = await internalBrowser.init({
        browserName,
        gridUrl,
        viewport,
        storybookUrl: address,
      });

      return done ? internalBrowser : null;
    } catch (originalError) {
      void internalBrowser.closeBrowser();

      const message =
        originalError instanceof Error ? originalError.message : ((originalError ?? 'Unknown error') as string);
      const error = new Error(`Can't load storybook root page: ${message}`);
      if (originalError instanceof Error) error.stack = originalError.stack;

      logger().error(error);

      return null;
    }
  }

  private async init({
    browserName,
    gridUrl,
    viewport,
    storybookUrl,
  }: {
    browserName: string;
    gridUrl: string;
    viewport?: { width: number; height: number };
    storybookUrl: string;
  }): Promise<boolean> {
    const sessionId = (await this.#browser.getSession()).getId();
    let browserHost = '';

    try {
      const { Name } = await getSessionData(gridUrl, sessionId);
      if (typeof Name == 'string') browserHost = Name;
    } catch {
      /* noop */
    }

    prefix.apply(logger(), {
      format(level) {
        const levelColor = colors[level.toUpperCase() as keyof typeof colors];
        return `[${browserName}:${chalk.gray(process.pid)}] ${levelColor(level)} => ${chalk.gray(sessionId)}`;
      },
    });

    logger().debug(`Connected successful with ${chalk.green(browserHost)}`);

    this.#sessionId = sessionId;

    return await runSequence(
      [
        () => this.#browser.manage().setTimeouts({ pageLoad: 60000, script: 60000 }),
        () => this.openStorybookPage(storybookUrl),
        () => this.initStorybook(),
        // NOTE: Selenium draws automation toolbar with some delay after webdriver initialization
        // NOTE: So if we resize window right after getting webdriver instance we might get situation
        // NOTE: When the toolbar appears after resize and final viewport size become smaller than we set
        () => this.resizeViewport(viewport),
        () => {
          this.keepAlive();
        },
      ],
      () => !this.#isShuttingDown,
    );
  }

  private async initStorybook() {
    await this.#browser.executeScript((id: string) => (window.__CREEVEY_SESSION_ID__ = id), this.#sessionId);

    return await runSequence(
      [() => this.waitForStorybook(), () => this.loadStorybookStories(), () => this.defineGlobals()],
      () => !this.#isShuttingDown,
    );
  }

  private async openStorybookPage(storybookUrl: string): Promise<void> {
    if (!LOCALHOST_REGEXP.test(storybookUrl)) {
      return this.#browser.get(appendIframePath(storybookUrl));
    }

    try {
      // NOTE: getUrlChecker already calls `browser.get` so we don't need another one
      await resolveStorybookUrl(appendIframePath(storybookUrl), (url) => this.checkUrl(url));
    } catch (error) {
      logger().error('Failed to resolve storybook URL', error instanceof Error ? error.message : '');
      throw error;
    }
  }

  private async checkUrl(url: string): Promise<boolean> {
    try {
      // NOTE: Before trying a new url, reset the current one
      logger().debug(`Opening ${chalk.magenta('about:blank')} page`);
      await openUrlAndWaitForPageSource(
        this.#browser,
        'about:blank',
        (source: string) => !source.includes('<body></body>'),
      );
      logger().debug(`Opening ${chalk.magenta(url)} and checking the page source`);
      const source = await openUrlAndWaitForPageSource(
        this.#browser,
        url,
        // NOTE: IE11 can return only `head` without body
        (source: string) => source.length == 0 || !/<body([^>]*>).+<\/body>/s.test(source),
      );
      // NOTE: This is the most optimal way to check if we in storybook or not
      // We don't use any page load strategies except `NONE`
      // because other add significant delay and some of them don't work in earlier chrome versions
      // Browsers always load page successful even it's failed
      // So we just check `root` element
      logger().debug(`Checking ${chalk.cyan(`#${storybookRootID}`)} existence on ${chalk.magenta(url)}`);
      return source.includes(`id="${storybookRootID}"`);
    } catch {
      return false;
    }
  }

  private async waitForStorybook(): Promise<void> {
    logger().debug('Waiting for Storybook to initiate');

    void this.#browser
      .executeScript(function () {
        requestAnimationFrame(check);

        function check() {
          if (
            document.readyState !== 'complete' ||
            typeof window.__STORYBOOK_PREVIEW__ === 'undefined' ||
            typeof window.__STORYBOOK_ADDONS_CHANNEL__ === 'undefined' ||
            (!('ready' in window.__STORYBOOK_PREVIEW__) &&
              window.__STORYBOOK_ADDONS_CHANNEL__.last('setGlobals') === undefined)
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
      })
      .catch(() => {
        /* noop */
      });

    let isWaitingForStorybook = true;
    const isTimeout = await Promise.race([
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          isWaitingForStorybook = false;
          resolve(true);
        }, 60000);
      }),
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (isWaitingForStorybook) {
          if (await this.#browser.executeScript(() => window.__CREEVYE_STORYBOOK_READY__)) return false;
          else await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return true;
      })(),
    ]);

    if (isTimeout) throw new Error('Failed to wait Storybook init');
  }

  private async loadStorybookStories() {
    logger().debug('Loading Storybook stories');

    void this.#browser
      .executeScript(() => {
        void window.__STORYBOOK_PREVIEW__.extract().then((stories) => {
          window.__CREEVEY_STORYBOOK_STORIES__ = stories;
        });
      })
      .catch(() => {
        /* noop */
      });

    let isWaitingForStories = true;
    const result = await Promise.race([
      new Promise<{ type: 'timeout' }>((resolve) => {
        setTimeout(() => {
          isWaitingForStories = false;
          resolve({ type: 'timeout' });
        }, 60000);
      }),
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (isWaitingForStories) {
          const [hasStories, sessionId] = await this.#browser.executeScript<[boolean, string]>(() => [
            Boolean(window.__CREEVEY_STORYBOOK_STORIES__),
            window.__CREEVEY_SESSION_ID__,
          ]);
          if (hasStories) return { type: 'stories' } as const;
          if (sessionId !== this.#sessionId) return { type: 'reload' } as const;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return { type: 'timeout' } as const;
      })(),
    ]);

    if (result.type === 'timeout') throw new Error('Failed to load Storybook stories');
    if (result.type === 'reload') await this.waitForStorybook();
  }

  private async defineGlobals(): Promise<void> {
    logger().debug('Defining Storybook globals');
    await this.#browser.executeAsyncScript(function (userGlobals: StorybookGlobals | undefined, callback: () => void) {
      // @ts-expect-error https://github.com/evanw/esbuild/issues/2605#issuecomment-2050808084
      window.__name = (func: unknown) => func;
      if (userGlobals) {
        window.__STORYBOOK_ADDONS_CHANNEL__.once('globalsUpdated', () => {
          callback();
        });
        window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: userGlobals });
      } else {
        callback();
      }
    }, this.#storybookGlobals);
  }

  private async resizeViewport(viewport?: { width: number; height: number }): Promise<void> {
    if (!viewport) return;

    const windowRect = await this.#browser.manage().window().getRect();
    const { innerWidth, innerHeight } = await this.#browser.executeScript<{ innerWidth: number; innerHeight: number }>(
      function () {
        return {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        };
      },
    );

    logger().debug(`Resizing viewport from ${innerWidth}x${innerHeight} to ${viewport.width}x${viewport.height}`);

    const dWidth = windowRect.width - innerWidth;
    const dHeight = windowRect.height - innerHeight;
    await this.#browser
      .manage()
      .window()
      .setRect({
        width: viewport.width + dWidth,
        height: viewport.height + dHeight,
      });
  }

  private async resetMousePosition(): Promise<void> {
    logger().debug('Resetting mouse position to the top-left corner');
    const browserName = (await this.#browser.getCapabilities()).getBrowserName();
    const [browserVersion] =
      (await this.#browser.getCapabilities()).getBrowserVersion()?.split('.') ??
      ((await this.#browser.getCapabilities()).get('version') as string | undefined)?.split('.') ??
      [];

    // NOTE Reset mouse position to support keweb selenium grid browser versions
    if (browserName == 'chrome' && browserVersion == '70') {
      const { top, left, width, height } = await this.#browser.executeScript<ElementRect>(function (): ElementRect {
        const bodyRect = document.body.getBoundingClientRect();

        return {
          top: bodyRect.top,
          left: bodyRect.left,
          width: bodyRect.width,
          height: bodyRect.height,
        };
      });
      // NOTE Bridge mode doesn't support `Origin.VIEWPORT`, move mouse relative
      await this.#browser
        .actions({ bridge: true })
        .move({
          origin: this.#browser.findElement(By.css('body')),
          x: Math.ceil((-1 * width) / 2) - left,
          y: Math.ceil((-1 * height) / 2) - top,
        })
        .perform();
    } else if (browserName == 'firefox') {
      // NOTE Firefox for some reason moving by 0 x 0 move cursor in bottom left corner :sad:
      // NOTE In recent versions (eg 128.0) moving by 0 x 0 doesn't work at all
      await this.#browser.actions().move({ origin: Origin.VIEWPORT, x: 0, y: 1 }).perform();
    } else {
      // NOTE IE don't emit move events until force window focus or connect by RDP on virtual machine
      await this.#browser.actions().move({ origin: Origin.VIEWPORT, x: 0, y: 0 }).perform();
    }
  }

  private async insertIgnoreStyles(ignoreElements?: string | string[] | null): Promise<WebElement | null> {
    const ignoreSelectors = Array.prototype.concat(ignoreElements).filter(Boolean);
    if (!ignoreSelectors.length) return null;

    logger().debug('Hiding ignored elements before capturing');

    return await this.#browser.executeScript(insertIgnoreStyles, ignoreSelectors);
  }

  private async takeCompositeScreenshot(windowRect: ElementRect, elementRect: ElementRect): Promise<Buffer> {
    const screens = [];
    const isScreenshotWithoutScrollBar = !(await this.hasScrollBar());
    const scrollBarWidth = await this.getScrollBarWidth();
    // NOTE Sometimes viewport has been scrolled somewhere
    const normalizedElementRect = {
      left: elementRect.left - windowRect.left,
      right: elementRect.left + elementRect.width - windowRect.left,
      top: elementRect.top - windowRect.top,
      bottom: elementRect.top + elementRect.height - windowRect.top,
    };
    const isFitHorizontally = windowRect.width >= elementRect.width + normalizedElementRect.left;
    const isFitVertically = windowRect.height >= elementRect.height + normalizedElementRect.top;
    const viewportWidth = windowRect.width - (isFitVertically ? 0 : scrollBarWidth);
    const viewportHeight = windowRect.height - (isFitHorizontally ? 0 : scrollBarWidth);
    const cols = Math.ceil(elementRect.width / viewportWidth);
    const rows = Math.ceil(elementRect.height / viewportHeight);
    const xOffset = Math.round(
      isFitHorizontally ? normalizedElementRect.left : Math.max(0, cols * viewportWidth - elementRect.width),
    );
    const yOffset = Math.round(
      isFitVertically ? normalizedElementRect.top : Math.max(0, rows * viewportHeight - elementRect.height),
    );

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const dx = Math.min(
          viewportWidth * col + normalizedElementRect.left,
          Math.max(0, normalizedElementRect.right - viewportWidth),
        );
        const dy = Math.min(
          viewportHeight * row + normalizedElementRect.top,
          Math.max(0, normalizedElementRect.bottom - viewportHeight),
        );
        await this.#browser.executeScript(
          function (x: number, y: number) {
            window.scrollTo(x, y);
          },
          dx,
          dy,
        );
        screens.push(await this.#browser.takeScreenshot());
      }
    }

    const images = screens.map((s) => Buffer.from(s, 'base64')).map((b) => PNG.sync.read(b));
    const compositeImage = new PNG({ width: Math.round(elementRect.width), height: Math.round(elementRect.height) });

    for (let y = 0; y < compositeImage.height; y += 1) {
      for (let x = 0; x < compositeImage.width; x += 1) {
        const col = Math.floor(x / viewportWidth);
        const row = Math.floor(y / viewportHeight);
        const isLastCol = cols - col == 1;
        const isLastRow = rows - row == 1;
        const scrollOffset = isFitVertically || isScreenshotWithoutScrollBar ? 0 : scrollBarWidth;
        const i = (y * compositeImage.width + x) * 4;
        const j =
          // NOTE compositeImage(x, y) => image(x, y)
          ((y % viewportHeight) * (viewportWidth + scrollOffset) + (x % viewportWidth)) * 4 +
          // NOTE Offset for last row/col image
          (isLastRow ? yOffset * (viewportWidth + scrollOffset) * 4 : 0) +
          (isLastCol ? xOffset * 4 : 0);
        const image = images[row * cols + col];
        compositeImage.data[i + 0] = image.data[j + 0];
        compositeImage.data[i + 1] = image.data[j + 1];
        compositeImage.data[i + 2] = image.data[j + 2];
        compositeImage.data[i + 3] = image.data[j + 3];
      }
    }
    return PNG.sync.write(compositeImage);
  }

  private async removeIgnoreStyles(ignoreStyles: WebElement | null): Promise<void> {
    if (ignoreStyles) {
      logger().debug('Revert hiding ignored elements');
      await this.#browser.executeScript(removeIgnoreStyles, ignoreStyles);
    }
  }

  // NOTE Firefox and Safari take viewport screenshot without scrollbars
  private async hasScrollBar(): Promise<boolean> {
    const browserName = (await this.#browser.getCapabilities()).getBrowserName();
    const [browserVersion] = (await this.#browser.getCapabilities()).getBrowserVersion()?.split('.') ?? [];

    return (
      browserName != 'Safari' &&
      // NOTE This need to work with keweb selenium grid
      !(browserName == 'firefox' && browserVersion == '61')
    );
  }

  private async getScrollBarWidth(): Promise<number> {
    const scrollBarWidth = await this.#browser.executeScript<number>(function () {
      // eslint-disable-next-line no-var
      var div = document.createElement('div');
      div.innerHTML = 'a'; // NOTE: In IE clientWidth is 0 if this div is empty.
      div.style.overflowY = 'scroll';
      document.body.appendChild(div);
      // eslint-disable-next-line no-var
      var widthDiff = div.offsetWidth - div.clientWidth;
      document.body.removeChild(div);

      return widthDiff;
    });
    return scrollBarWidth;
  }

  private keepAlive(): void {
    this.#keepAliveInterval = setInterval(() => {
      // NOTE Simple way to keep session alive
      void this.#browser
        .getCurrentUrl()
        .then((url) => {
          logger().debug('current url', chalk.magenta(url));
        })
        .catch((error: unknown) => {
          logger().error(error);
          emitWorkerMessage({
            type: 'error',
            payload: { subtype: 'browser', error: 'Failed to ping browser' },
          });
        });
    }, 10 * 1000);
  }
}
