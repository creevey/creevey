import { Args } from '@storybook/csf';
import { SET_GLOBALS, UPDATE_STORY_ARGS, STORY_RENDERED } from '@storybook/core-events';
import chalk from 'chalk';
import http from 'http';
import https from 'https';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import { Context, Suite, Test } from 'mocha';
import { networkInterfaces } from 'os';
import { PNG } from 'pngjs';
import { Builder, By, Capabilities, Origin, WebDriver, WebElement, logging } from 'selenium-webdriver';
// import { Options as IeOptions } from 'selenium-webdriver/ie';
// import { Options as EdgeOptions } from 'selenium-webdriver/edge';
// import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
// import { Options as SafariOptions } from 'selenium-webdriver/safari';
// import { Options as FirefoxOptions } from 'selenium-webdriver/firefox';
import { PageLoadStrategy } from 'selenium-webdriver/lib/capabilities.js';
import {
  BrowserConfig,
  Config,
  CreeveyStoryParams,
  isDefined,
  noop,
  StorybookGlobals,
  StoryInput,
  StoriesRaw,
  Options,
} from '../../types.js';
import { colors, logger } from '../logger.js';
import { emitStoriesMessage, subscribeOn } from '../messages.js';
import { isShuttingDown, LOCALHOST_REGEXP, runSequence } from '../utils.js';
import { Preferences } from 'selenium-webdriver/lib/logging.js';

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

declare global {
  interface Window {
    __CREEVEY_RESTORE_SCROLL__?: () => void;
    __CREEVEY_UPDATE_GLOBALS__: (globals: StorybookGlobals) => void;
    __CREEVEY_INSERT_IGNORE_STYLES__: (ignoreElements: string[]) => HTMLStyleElement;
    __CREEVEY_REMOVE_IGNORE_STYLES__: (ignoreStyles: HTMLStyleElement) => void;
  }
}

// type UnPromise<P> = P extends Promise<infer T> ? T : never;

const storybookRootID = 'storybook-root';
const DOCKER_INTERNAL = 'host.docker.internal';
let browserName = '';
let browser: WebDriver | null = null;
// let context: UnPromise<ReturnType<typeof BrowsingContext>> | null = null;
let creeveyServerHost: string | null = null;
let creeveyServerPort: number | null = null;

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

function getAddresses(): string[] {
  // TODO Check if docker is used
  return [DOCKER_INTERNAL].concat(
    ...Object.values(networkInterfaces())
      .filter(isDefined)
      .map((network) => network.filter((info) => info.family == 'IPv4').map((info) => info.address)),
  );
}

async function resolveStorybookUrl(storybookUrl: string, checkUrl: (url: string) => Promise<boolean>): Promise<string> {
  logger().debug('Resolving storybook url');
  const addresses = getAddresses();
  for (const ip of addresses) {
    const resolvedUrl = storybookUrl.replace(LOCALHOST_REGEXP, ip);
    logger().debug(`Checking storybook availability on ${chalk.magenta(resolvedUrl)}`);
    if (await checkUrl(resolvedUrl)) {
      logger().debug(`Resolved storybook url ${chalk.magenta(resolvedUrl)}`);
      return resolvedUrl;
    }
  }
  throw new Error('Please specify `storybookUrl` with IP address that accessible from remote browser');
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

function getUrlChecker(browser: WebDriver): (url: string) => Promise<boolean> {
  return async (url: string): Promise<boolean> => {
    try {
      // NOTE: Before trying a new url, reset the current one
      logger().debug(`Opening ${chalk.magenta('about:blank')} page`);
      await openUrlAndWaitForPageSource(browser, 'about:blank', (source: string) => !source.includes('<body></body>'));
      logger().debug(`Opening ${chalk.magenta(url)} and checking the page source`);
      const source = await openUrlAndWaitForPageSource(
        browser,
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
  };
}

async function buildWebdriver(
  gridUrl: string,
  capabilities: Capabilities,
  prefs: Preferences,
): Promise<readonly [string, WebDriver]> {
  const maxRetries = 5;
  let maybeResult = null;
  let retries = 0;
  do {
    maybeResult = await Promise.race([
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

        const browser = await new Builder()
          // .setIeOptions(ie)
          // .setEdgeOptions(edge)
          // .setChromeOptions(chrome)
          // .setSafariOptions(safari)
          // .setFirefoxOptions(firefox)
          .usingServer(gridUrl)
          .withCapabilities(capabilities)
          .setLoggingPrefs(prefs) // NOTE: Should go last
          .build();

        // const id = await browser.getWindowHandle();
        // context = await BrowsingContext(browser, { browsingContextId: id });

        const sessionId = (await browser.getSession()).getId();

        if (retry != retries) {
          void browser.quit();
          return null;
        }

        return [sessionId, browser] as const;
      })(),
    ]);
    if (maybeResult) break;
  } while (retries < maxRetries);

  if (!maybeResult) throw new Error('Failed to initialize session to Selenium Grid due to many retries');

  return maybeResult;
}

async function waitForStorybook(browser: WebDriver): Promise<void> {
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
          wait = await browser.executeScript<boolean>(function (SET_GLOBALS: string): boolean {
            if (typeof window.__STORYBOOK_ADDONS_CHANNEL__ == 'undefined') return true;
            if (window.__STORYBOOK_ADDONS_CHANNEL__.last(SET_GLOBALS) == undefined) return true;
            return false;
          }, SET_GLOBALS);
        } catch (e: unknown) {
          logger().debug('An error has been caught during the script:', e);
        }
      } while (wait);
      return false;
    })(),
  ]);

  // TODO Change the message to describe a reason why it might happen
  if (isTimeout) throw new Error('Failed to wait `setStories` event');
}

async function resetMousePosition(browser: WebDriver): Promise<void> {
  logger().debug('Resetting mouse position to the top-left corner');
  const browserName = (await browser.getCapabilities()).getBrowserName();
  const [browserVersion] =
    (await browser.getCapabilities()).getBrowserVersion()?.split('.') ??
    ((await browser.getCapabilities()).get('version') as string | undefined)?.split('.') ??
    [];

  // NOTE Reset mouse position to support keweb selenium grid browser versions
  if (browserName == 'chrome' && browserVersion == '70') {
    const { top, left, width, height } = await browser.executeScript<ElementRect>(function (): ElementRect {
      const bodyRect = document.body.getBoundingClientRect();

      return {
        top: bodyRect.top,
        left: bodyRect.left,
        width: bodyRect.width,
        height: bodyRect.height,
      };
    });
    // NOTE Bridge mode doesn't support `Origin.VIEWPORT`, move mouse relative
    await browser
      .actions({ bridge: true })
      .move({
        origin: browser.findElement(By.css('body')),
        x: Math.ceil((-1 * width) / 2) - left,
        y: Math.ceil((-1 * height) / 2) - top,
      })
      .perform();
  } else if (browserName == 'firefox') {
    // NOTE Firefox for some reason moving by 0 x 0 move cursor in bottom left corner :sad:
    // NOTE In recent versions (eg 128.0) moving by 0 x 0 doesn't work at all
    await browser.actions().move({ origin: Origin.VIEWPORT, x: 0, y: 1 }).perform();
  } else {
    // NOTE IE don't emit move events until force window focus or connect by RDP on virtual machine
    await browser.actions().move({ origin: Origin.VIEWPORT, x: 0, y: 0 }).perform();
  }
}

async function resizeViewport(browser: WebDriver, viewport: { width: number; height: number }): Promise<void> {
  const windowRect = await browser.manage().window().getRect();
  const { innerWidth, innerHeight } = await browser.executeScript<{ innerWidth: number; innerHeight: number }>(
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
  await browser
    .manage()
    .window()
    .setRect({
      width: viewport.width + dWidth,
      height: viewport.height + dHeight,
    });
}

const getScrollBarWidth: (browser: WebDriver) => Promise<number> = (() => {
  let scrollBarWidth: number | null = null;

  return async (browser: WebDriver): Promise<number> => {
    if (scrollBarWidth != null) return Promise.resolve(scrollBarWidth);
    scrollBarWidth = await browser.executeScript<number>(function () {
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
  };
})();

// NOTE Firefox and Safari take viewport screenshot without scrollbars
async function hasScrollBar(browser: WebDriver): Promise<boolean> {
  const browserName = (await browser.getCapabilities()).getBrowserName();
  const [browserVersion] = (await browser.getCapabilities()).getBrowserVersion()?.split('.') ?? [];

  return (
    browserName != 'Safari' &&
    // NOTE This need to work with keweb selenium grid
    !(browserName == 'firefox' && browserVersion == '61')
  );
}

async function takeCompositeScreenshot(
  browser: WebDriver,
  windowRect: ElementRect,
  elementRect: ElementRect,
): Promise<string> {
  const screens = [];
  const isScreenshotWithoutScrollBar = !(await hasScrollBar(browser));
  const scrollBarWidth = await getScrollBarWidth(browser);
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
      await browser.executeScript(
        function (x: number, y: number) {
          window.scrollTo(x, y);
        },
        dx,
        dy,
      );
      screens.push(await browser.takeScreenshot());
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
  return PNG.sync.write(compositeImage).toString('base64');
}

export async function takeScreenshot(
  browser: WebDriver,
  captureElement?: string | null,
  ignoreElements?: string | string[] | null,
): Promise<string> {
  let screenshot: string;

  const ignoreStyles = await insertIgnoreStyles(browser, ignoreElements);

  if (logger().getLevel() <= Logger.levels.DEBUG) {
    const { innerWidth, innerHeight } = await browser.executeScript<{ innerWidth: number; innerHeight: number }>(
      function () {
        return {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        };
      },
    );
    logger().debug(`Viewport size is: ${innerWidth}x${innerHeight}`);
  }

  try {
    if (!captureElement) {
      logger().debug('Capturing viewport screenshot');
      screenshot = await browser.takeScreenshot();
      logger().debug('Viewport screenshot is captured');
    } else {
      logger().debug(`Checking is element ${chalk.cyan(captureElement)} fit into viewport`);
      const rects = await browser.executeScript<{ elementRect: ElementRect; windowRect: ElementRect } | undefined>(
        function (selector: string): { elementRect: ElementRect; windowRect: ElementRect } | undefined {
          window.scrollTo(0, 0); // TODO Maybe we should remove same code from `resetMousePosition`
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
              // eslint-disable-next-line @typescript-eslint/no-deprecated
              top: Math.round(window.scrollY || window.pageYOffset),
              // eslint-disable-next-line @typescript-eslint/no-deprecated
              left: Math.round(window.scrollX || window.pageXOffset),
              width: window.innerWidth,
              height: window.innerHeight,
            },
          };
        },
        captureElement,
      );
      const { elementRect, windowRect } = rects ?? {};

      if (!elementRect || !windowRect) throw new Error(`Couldn't find element with selector: '${captureElement}'`);

      const isFitIntoViewport =
        elementRect.width + elementRect.left <= windowRect.width &&
        elementRect.height + elementRect.top <= windowRect.height;

      if (isFitIntoViewport) {
        logger().debug(`Capturing ${chalk.cyan(captureElement)} with size: ${elementRect.width}x${elementRect.height}`);
      } else
        logger().debug(
          `Capturing composite screenshot image of ${chalk.cyan(captureElement)} with size: ${elementRect.width}x${elementRect.height}`,
        );

      // const element = await browser.findElement(By.css(captureElement));
      // screenshot = isFitIntoViewport
      //   ? context
      //     ? await context.captureElementScreenshot(await element.getId())
      //     : await browser.findElement(By.css(captureElement)).takeScreenshot()
      //   : // TODO pointer-events: none, need to research
      //     await takeCompositeScreenshot(browser, windowRect, elementRect);
      screenshot = isFitIntoViewport
        ? await browser.findElement(By.css(captureElement)).takeScreenshot()
        : // TODO pointer-events: none, need to research
          await takeCompositeScreenshot(browser, windowRect, elementRect);

      logger().debug(`${chalk.cyan(captureElement)} is captured`);
    }
  } finally {
    await removeIgnoreStyles(browser, ignoreStyles);
  }

  return screenshot;
}

async function selectStory(browser: WebDriver, storyId: string, waitForReady = false): Promise<boolean> {
  logger().debug(`Triggering 'SetCurrentStory' event with storyId ${chalk.magenta(storyId)}`);

  const result = await browser.executeAsyncScript<[error?: string | null, isCaptureCalled?: boolean] | null>(
    function (
      id: string,
      shouldWaitForReady: boolean,
      callback: (response: [error?: string | null, isCaptureCalled?: boolean]) => void,
    ) {
      if (typeof window.__CREEVEY_SELECT_STORY__ == 'undefined') {
        callback([
          "Creevey can't switch story. This may happened if forget to add `creevey` addon to your storybook config, or storybook not loaded in browser due syntax error.",
        ]);
        return;
      }
      void window.__CREEVEY_SELECT_STORY__(id, shouldWaitForReady, callback);
    },
    storyId,
    waitForReady,
  );

  const [errorMessage, isCaptureCalled = false] = result ?? [];

  if (errorMessage) throw new Error(errorMessage);

  return isCaptureCalled;
}

export async function updateStorybookGlobals(browser: WebDriver, globals: StorybookGlobals): Promise<void> {
  logger().debug('Applying storybook globals');
  await browser.executeScript(function (globals: StorybookGlobals) {
    window.__CREEVEY_UPDATE_GLOBALS__(globals);
  }, globals);
}

function appendIframePath(url: string): string {
  return `${url.replace(/\/$/, '')}/iframe.html`;
}

async function openStorybookPage(
  browser: WebDriver,
  storybookUrl: string,
  resolver?: () => Promise<string>,
): Promise<void> {
  if (!LOCALHOST_REGEXP.test(storybookUrl)) {
    return browser.get(appendIframePath(storybookUrl));
  }

  try {
    if (resolver) {
      logger().debug('Resolving storybook url with custom resolver');

      const resolvedUrl = await resolver();

      logger().debug(`Resolver storybook url ${resolvedUrl}`);

      await browser.get(appendIframePath(resolvedUrl));
    } else {
      // NOTE: getUrlChecker already calls `browser.get` so we don't need another one
      await resolveStorybookUrl(appendIframePath(storybookUrl), getUrlChecker(browser));
    }
  } catch (error) {
    logger().error('Failed to resolve storybook URL', error instanceof Error ? error.message : '');
    throw error;
  }
}

async function resolveCreeveyHost(browser: WebDriver, port: number, host?: string): Promise<void> {
  const fetcher = function (hosts: string[], port: number, callback: (host?: string | null) => void) {
    void Promise.all(
      hosts.map(function (host) {
        return Promise.race([
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          fetch('http://' + host + ':' + port + '/ping').then(function (response) {
            return response.text();
          }),
          new Promise((_resolve, reject) => {
            setTimeout(reject, 5000);
          }),
        ])
          .then(function (pong) {
            return pong == 'pong' ? host : null;
          })
          .catch(function () {
            return null;
          });
      }),
    ).then(function (hosts) {
      callback(
        hosts.find(function (host) {
          return host != null;
        }),
      );
    });
  };

  const addresses = host ? [host] : getAddresses();

  creeveyServerPort = port;
  creeveyServerHost = await browser.executeAsyncScript(fetcher, addresses, port);

  if (creeveyServerHost == null) throw new Error("Can't reach creevey server from a browser");
}

export async function loadStoriesFromBrowser(): Promise<StoriesRaw> {
  if (!browser) throw new Error("Can't get stories from browser if webdriver isn't connected");

  const stories = await browser.executeAsyncScript<StoriesRaw | undefined>(function (
    callback: (stories: StoriesRaw | undefined) => void,
  ) {
    void window.__CREEVEY_GET_STORIES__().then(callback);
  });

  if (!stories) throw new Error("Can't get stories, it seems creevey or storybook API isn't available");

  return stories;
}

export async function getBrowser(config: Config, options: Options & { browser: string }): Promise<WebDriver | null> {
  if (browser) return browser;

  browserName = options.browser;
  const browserConfig = config.browsers[browserName] as BrowserConfig;
  const {
    gridUrl = config.gridUrl,
    storybookUrl: address = config.storybookUrl,
    limit,
    viewport,
    _storybookGlobals,
    ...userCapabilities
  } = browserConfig;
  void limit;
  const realAddress = address;

  // TODO Define some capabilities explicitly and define typings
  const capabilities = new Capabilities({ ...userCapabilities, pageLoadStrategy: PageLoadStrategy.EAGER });

  subscribeOn('shutdown', () => {
    void browser?.quit().finally(() => process.exit());
    browser = null;
  });

  const url = new URL(gridUrl);
  url.username = url.username ? '********' : '';
  url.password = url.password ? '********' : '';
  logger().debug(`(${browserName}) Connecting to Selenium ${chalk.magenta(url.toString())}`);

  const prefs = new logging.Preferences();

  if (options.trace) {
    for (const type of Object.values(logging.Type)) {
      prefs.setLevel(type as string, logging.Level.ALL);
    }
  }

  let sessionId;
  let browserHost = '';

  [sessionId, browser] = await buildWebdriver(gridUrl, capabilities, prefs);

  try {
    const { Name } = await getSessionData(gridUrl, sessionId);
    if (typeof Name == 'string') browserHost = Name;
  } catch {
    /* noop */
  }

  logger().debug(
    `(${browserName}) Connected successful with ${[chalk.green(browserHost), chalk.magenta(sessionId)]
      .filter(Boolean)
      .join(':')}`,
  );

  prefix.apply(logger(), {
    format(level) {
      const levelColor = colors[level.toUpperCase() as keyof typeof colors];
      return `[${browserName}:${chalk.gray(process.pid)}] ${levelColor(level)} => ${chalk.gray(sessionId)}`;
    },
  });

  try {
    await runSequence(
      [
        () => browser?.manage().setTimeouts({ pageLoad: 60000, script: 60000 }),
        () => browser && openStorybookPage(browser, realAddress, config.resolveStorybookUrl),
        () => browser && waitForStorybook(browser),
        () => browser && resolveCreeveyHost(browser, options.port, options.host),
        () => browser && updateBrowserGlobalVariables(browser),
        () => _storybookGlobals && browser && updateStorybookGlobals(browser, _storybookGlobals),
        // NOTE: Selenium draws automation toolbar with some delay after webdriver initialization
        // NOTE: So if we resize window right after getting webdriver instance we might get situation
        // NOTE: When the toolbar appears after resize and final viewport size become smaller than we set
        () => viewport && browser && resizeViewport(browser, viewport),
      ],
      () => !isShuttingDown.current,
    );
  } catch (originalError) {
    if (isShuttingDown.current) {
      browser.quit().catch(noop);
      browser = null;
      return null;
    }
    const currentUrl = await browser.getCurrentUrl();
    const error = new Error(
      `Can't load storybook root page${currentUrl ? ` by URL ${currentUrl}` : ''}: ${originalError instanceof Error ? originalError.message : ((originalError ?? 'Unknown error') as string)}`,
    );
    if (originalError instanceof Error) error.stack = originalError.stack;
    throw error;
  }

  return browser;
}

async function updateBrowserGlobalVariables(browser: WebDriver) {
  await browser.executeScript(
    function (workerId: number, creeveyHost: string, creeveyPort: number) {
      window.__CREEVEY_WORKER_ID__ = workerId;
      window.__CREEVEY_SERVER_HOST__ = creeveyHost;
      window.__CREEVEY_SERVER_PORT__ = creeveyPort;
    },
    process.pid,
    creeveyServerHost,
    creeveyServerPort,
  );
}

async function updateStoryArgs(browser: WebDriver, story: StoryInput, updatedArgs: Args): Promise<void> {
  await browser.executeAsyncScript<undefined>(
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
    UPDATE_STORY_ARGS,
    STORY_RENDERED,
  );
}

export async function closeBrowser(): Promise<void> {
  if (!browser) return;
  try {
    await browser.quit();
  } finally {
    browser = null;
  }
}

export async function switchStory(this: Context): Promise<void> {
  let testOrSuite: Test | Suite | undefined = this.currentTest;

  if (!testOrSuite) throw new Error("Can't switch story, because test context doesn't have 'currentTest' field");

  this.testScope.length = 0;
  this.screenshots.length = 0;
  this.testScope.push(this.browserName);
  while (testOrSuite?.title) {
    this.testScope.push(testOrSuite.title);
    testOrSuite = testOrSuite.parent;
  }
  const story = this.currentTest?.ctx?.story as StoryInput | undefined;

  if (!story) throw new Error(`Current test '${this.testScope.join('/')}' context doesn't have 'story' field`);

  const { id, title, name, parameters } = story;
  const {
    captureElement = `#${storybookRootID}`,
    waitForReady,
    ignoreElements,
  } = (parameters.creevey ?? {}) as CreeveyStoryParams;

  logger().debug(`Switching to story ${chalk.cyan(title)}/${chalk.cyan(name)} by id ${chalk.magenta(id)}`);

  if (captureElement)
    Object.defineProperty(this, 'captureElement', {
      enumerable: true,
      configurable: true,
      get: () => this.browser.findElement(By.css(captureElement)),
    });
  else Reflect.deleteProperty(this, 'captureElement');

  this.takeScreenshot = () => takeScreenshot(this.browser, captureElement, ignoreElements);
  this.updateStoryArgs = (updatedArgs: Args) => updateStoryArgs(this.browser, story, updatedArgs);

  this.testScope.reverse();

  let storyPlayResolver: (isCompleted: boolean) => void;
  let waitForComplete = new Promise<boolean>((resolve) => (storyPlayResolver = resolve));
  const unsubscribe = subscribeOn('stories', (message) => {
    if (message.type != 'capture') return;
    const { payload = {}, payload: { imageName } = {} } = message;
    void takeScreenshot(
      this.browser,
      payload.captureElement ?? captureElement,
      payload.ignoreElements ?? ignoreElements,
    ).then((screenshot) => {
      this.screenshots.push({ imageName, screenshot });

      void this.browser
        .executeAsyncScript<boolean>(function (callback: (isCompleted: boolean) => void) {
          window.__CREEVEY_HAS_PLAY_COMPLETED_YET__(callback);
        })
        .then((isCompleted) => {
          storyPlayResolver(isCompleted);
        });

      emitStoriesMessage({ type: 'capture' });
    });
  });

  await updateBrowserGlobalVariables(this.browser);
  await resetMousePosition(this.browser);
  const isCaptureCalled = await selectStory(this.browser, id, waitForReady);

  if (isCaptureCalled) {
    while (!(await waitForComplete)) {
      waitForComplete = new Promise<boolean>((resolve) => (storyPlayResolver = resolve));
    }
  }

  unsubscribe();

  logger().debug(`Story ${chalk.magenta(id)} ready for capturing`);
}

async function insertIgnoreStyles(
  browser: WebDriver,
  ignoreElements?: string | string[] | null,
): Promise<WebElement | null> {
  const ignoreSelectors = Array.prototype.concat(ignoreElements).filter(Boolean);
  if (!ignoreSelectors.length) return null;

  logger().debug('Hiding ignored elements before capturing');

  return await browser.executeScript(function (ignoreSelectors: string[]) {
    return window.__CREEVEY_INSERT_IGNORE_STYLES__(ignoreSelectors);
  }, ignoreSelectors);
}

async function removeIgnoreStyles(browser: WebDriver, ignoreStyles: WebElement | null): Promise<void> {
  if (ignoreStyles) {
    logger().debug('Revert hiding ignored elements');
    await browser.executeScript(function (ignoreStyles: HTMLStyleElement) {
      window.__CREEVEY_REMOVE_IGNORE_STYLES__(ignoreStyles);
    }, ignoreStyles);
  }
}
