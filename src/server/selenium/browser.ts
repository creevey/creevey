import { PNG } from 'pngjs';
import { Context, Test, Suite } from 'mocha';
import { Builder, By, WebDriver, Origin, Capabilities } from 'selenium-webdriver';
import { Config, BrowserConfig, StoryInput, CreeveyStoryParams, noop, isDefined } from '../../types';
import { subscribeOn } from '../messages';
import { networkInterfaces } from 'os';
import { runSequence, LOCALHOST_REGEXP } from '../utils';
import { PageLoadStrategy } from 'selenium-webdriver/lib/capabilities';

declare global {
  interface Window {
    __CREEVEY_RESTORE_SCROLL__?: () => void;
  }
}

const DOCKER_INTERNAL = 'host.docker.internal';

async function resolveStorybookUrl(storybookUrl: string, checkUrl: (url: string) => Promise<boolean>): Promise<string> {
  if (!LOCALHOST_REGEXP.test(storybookUrl)) {
    return getIframeFromUrl(storybookUrl);
  }

  const addresses = [DOCKER_INTERNAL].concat(
    ...Object.values(networkInterfaces())
      .filter(isDefined)
      .map((network) => network.filter((info) => info.family == 'IPv4').map((info) => info.address)),
  );
  for (const ip of addresses) {
    const resolvedUrl = storybookUrl.replace(LOCALHOST_REGEXP, ip);
    if (await checkUrl(resolvedUrl)) {
      return resolvedUrl;
    }
  }
  const error = new Error(
    "Creevey couldn't resolve IP address of storybook URL. \
    Please specify `storybookUrl` with IP address that accessible from remote browser",
  );
  error.name = 'ResolveUrlError';
  throw error;
}

function getIframeFromUrl(url: string): string {
  return `${url.replace(/\/$/, '')}/iframe.html`;
}

function getUrlChecker(browser: WebDriver): (url: string) => Promise<boolean> {
  return async (url: string): Promise<boolean> => {
    try {
      //  NOTE: Before trying a new url, reset the current one
      await browser.get('about:blank');
      await browser.get(getIframeFromUrl(url));
      let source = '';
      do {
        try {
          source = await browser.getPageSource();
        } catch (_) {
          // NOTE: Firefox can raise exception "curContainer.frame.document.documentElement is null"
        }
        // NOTE: IE11 can return only `head` without body
      } while (source.length == 0 || !/<body([^>]*>).+<\/body>/s.test(source));
      // NOTE: This is the most optimal way to check if we in storybook or not
      // We don't use any page load strategies except `NONE`
      // because other add significant delay and some of them don't work in earlier chrome versions
      // Browsers always load page successful even it's failed
      // So we just check `#root` element
      return source.includes('<div id="root"></div>');
    } catch (error) {
      return false;
    }
  };
}

function waitForStorybook(browser: WebDriver): Promise<void> {
  return browser.executeAsyncScript(function (callback: () => void): void {
    if (document.readyState == 'complete') return callback();
    window.addEventListener('load', function () {
      callback();
    });
  });
}

async function resetMousePosition(browser: WebDriver): Promise<void> {
  const browserName = (await browser.getCapabilities()).getBrowserName();
  const [browserVersion] =
    (await browser.getCapabilities()).getBrowserVersion()?.split('.') ??
    ((await browser.getCapabilities()).get('version') as string | undefined)?.split('.') ??
    [];
  const { top, left, width, height } = await browser.executeScript<DOMRect>(function () {
    // NOTE On storybook >= 4.x already reset scroll
    // TODO Check this on new storybook
    window.scrollTo(0, 0);

    return document.body.getBoundingClientRect();
  });

  // NOTE Reset mouse position to support keweb selenium grid browser versions
  if (browserName == 'chrome' && browserVersion == '70') {
    // NOTE Bridge mode not support move mouse relative viewport
    await browser
      .actions({ bridge: true })
      .move({
        origin: browser.findElement(By.css('body')),
        x: Math.ceil((-1 * width) / 2) - left,
        y: Math.ceil((-1 * height) / 2) - top,
      })
      .perform();
  } else if (browserName == 'firefox' && browserVersion == '61') {
    // NOTE Firefox for some reason moving by 0 x 0 move cursor in bottom left corner :sad:
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
  windowRect: { width: number; height: number; x: number; y: number },
  elementRect: DOMRect,
): Promise<string> {
  const screens = [];
  const isScreenshotWithoutScrollBar = !(await hasScrollBar(browser));
  const scrollBarWidth = await getScrollBarWidth(browser);
  // NOTE Sometimes viewport has been scrolled somewhere
  const normalizedElementRect = {
    left: elementRect.left - windowRect.x,
    right: elementRect.right - windowRect.x,
    top: elementRect.top - windowRect.y,
    bottom: elementRect.bottom - windowRect.y,
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

async function takeScreenshot(browser: WebDriver, captureElement?: string | null): Promise<string> {
  if (!captureElement) return browser.takeScreenshot();

  const { elementRect, windowRect } = await browser.executeScript<{
    elementRect?: DOMRect;
    windowRect: { width: number; height: number; x: number; y: number };
  }>(function (selector: string) {
    window.scrollTo(0, 0);
    return {
      elementRect: document.querySelector(selector)?.getBoundingClientRect(),
      windowRect: {
        width: window.innerWidth,
        height: window.innerHeight,
        x: Math.round(window.scrollX),
        y: Math.round(window.scrollY),
      },
    };
  }, captureElement);

  if (!elementRect) throw new Error(`Couldn't find element with selector: '${captureElement}'`);

  const isFitIntoViewport =
    elementRect.width + elementRect.left <= windowRect.width &&
    elementRect.height + elementRect.top <= windowRect.height;

  if (isFitIntoViewport) return browser.findElement(By.css(captureElement)).takeScreenshot();

  return takeCompositeScreenshot(browser, windowRect, elementRect);
}

async function selectStory(browser: WebDriver, storyId: string, kind: string, story: string): Promise<void> {
  const errorMessage = await browser.executeAsyncScript<string | undefined>(
    function (storyId: string, kind: string, name: string, callback: (error?: string) => void) {
      if (typeof window.__CREEVEY_SELECT_STORY__ == 'undefined') {
        return callback(
          "Creevey can't switch story. This may happened if forget to add `creevey` addon to your storybook config, or storybook not loaded in browser due syntax error.",
        );
      }
      window.__CREEVEY_SELECT_STORY__(storyId, kind, name, callback);
    },
    storyId,
    kind,
    story,
  );
  if (errorMessage) throw new Error(errorMessage);
}

export async function getBrowser(config: Config, browserConfig: BrowserConfig): Promise<WebDriver | null> {
  const {
    gridUrl = config.gridUrl,
    storybookUrl: address = config.storybookUrl,
    limit,
    viewport,
    ...userCapabilities
  } = browserConfig;
  void limit;
  let realAddress = address;
  let browser: WebDriver | null = null;
  let shuttingDown = false;

  // TODO Define some capabilities explicitly and define typings
  const capabilities = new Capabilities(userCapabilities);
  capabilities.setPageLoadStrategy(PageLoadStrategy.NONE);

  subscribeOn('shutdown', () => {
    shuttingDown = true;
    browser?.quit().catch(noop);
    browser = null;
  });

  if (config.resolveStorybookUrl) {
    try {
      realAddress = await config.resolveStorybookUrl();
    } catch (_) {
      // skip
    }
  }

  try {
    browser = await new Builder().usingServer(gridUrl).withCapabilities(capabilities).build();

    await runSequence(
      [
        () => browser?.manage().setTimeouts({ pageLoad: 5000, script: 60000 }),
        () => viewport && browser && resizeViewport(browser, viewport),
        async () => browser && void (realAddress = await resolveStorybookUrl(realAddress, getUrlChecker(browser))),
        () => browser?.get(realAddress),
        () => browser && waitForStorybook(browser),
      ],
      () => !shuttingDown,
    );
  } catch (originalError) {
    if (shuttingDown) {
      browser?.quit().catch(noop);
      return null;
    }
    if (originalError instanceof Error && originalError.name == 'ResolveUrlError') throw originalError;
    const error = new Error(`Can't load storybook root page by URL ${realAddress}/iframe.html`);
    if (originalError instanceof Error) error.stack = originalError.stack;
    throw error;
  }

  return browser;
}

export async function switchStory(this: Context): Promise<void> {
  let testOrSuite: Test | Suite | undefined = this.currentTest;

  if (!testOrSuite) throw new Error("Can't switch story, because test context doesn't have 'currentTest' field");

  this.testScope.length = 0;
  this.testScope.push(this.browserName);
  while (testOrSuite?.title) {
    this.testScope.push(testOrSuite.title);
    testOrSuite = testOrSuite.parent;
  }
  const story = this.currentTest?.ctx?.story as StoryInput | undefined;

  if (!story) throw new Error(`Current test '${this.testScope.join('/')}' context doesn't have 'story' field`);

  await resetMousePosition(this.browser);
  await selectStory(this.browser, story.id, story.kind, story.name);

  const { captureElement = '#root' } = (story.parameters.creevey ?? {}) as CreeveyStoryParams;

  if (captureElement)
    Object.defineProperty(this, 'captureElement', {
      enumerable: true,
      configurable: true,
      get: () => this.browser.findElement(By.css(captureElement)),
    });
  else Reflect.deleteProperty(this, 'captureElement');

  this.takeScreenshot = () => takeScreenshot(this.browser, captureElement);

  this.testScope.reverse();
}
