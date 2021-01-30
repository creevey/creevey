import https from 'https';
import { Context, Test, Suite } from 'mocha';
import { Builder, By, until, WebDriver, Origin } from 'selenium-webdriver';
import { Config, BrowserConfig, SkipOptions, isDefined, CreeveyStory } from './types';
import { StoryContext } from '@storybook/addons';
import { StoryDidMountCallback } from './storybook';

// Need to support storybook 3.x
let toId: Function | null = null;
try {
  ({ toId } = require('@storybook/router'));
} catch (_) {
  /* ignore */
}

const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/;

function getRealIp(): Promise<string> {
  return new Promise((resolve, reject) =>
    https.get('https://fake.testkontur.ru/ip', res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Couldn't resolve real ip for \`localhost\`. Status code: ${res.statusCode}`));
      }

      let data = '';

      res.setEncoding('utf8');
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    }),
  );
}

async function resetMousePosition(browser: WebDriver): Promise<void> {
  const browserName = (await browser.getCapabilities()).getBrowserName();
  const [browserVersion] =
    (await browser.getCapabilities()).getBrowserVersion()?.split('.') ??
    ((await browser.getCapabilities()).get('version') as string | undefined)?.split('.') ??
    [];
  const { top, left, width, height } = await browser.executeScript<DOMRect>(function() {
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
    await browser
      .actions()
      .move({ origin: Origin.VIEWPORT, x: 0, y: 1 })
      .perform();
  } else {
    // NOTE IE don't emit move events until force window focus or connect by RDP on virtual machine
    await browser
      .actions()
      .move({ origin: Origin.VIEWPORT, x: 0, y: 0 })
      .perform();
  }
}

async function resizeViewport(browser: WebDriver, viewport: { width: number; height: number }): Promise<void> {
  const windowRect = await browser
    .manage()
    .window()
    .getRect();
  const { innerWidth, innerHeight } = await browser.executeScript(function() {
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });
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

async function selectStory(browser: WebDriver, kind: string, story: string): Promise<StoryContext> {
  const storyContext: StoryContext = await browser.executeAsyncScript(
    function(storyId: string, kind: string, name: string, callback: StoryDidMountCallback) {
      window.__CREEVEY_SELECT_STORY__(storyId, kind, name, callback);
    },
    // NOTE: `toId` don't exists in storybook 3.x
    toId ? toId(kind, story) : `${kind}--${story}`.toLowerCase(),
    kind,
    story,
  );
  return storyContext;
}

function disableAnimations(browser: WebDriver): Promise<void> {
  const disableAnimationsStyles = `
*,
*:hover,
*::before,
*::after {
  animation-delay: -0.0001ms !important;
  animation-duration: 0s !important;
  animation-play-state: paused !important;
  cursor: none !important;
  caret-color: transparent !important;
  transition: 0s !important;
}
`;
  return browser.executeScript(function(stylesheet: string) {
    /* eslint-disable no-var */
    var style = document.createElement('style');
    var textnode = document.createTextNode(stylesheet);
    style.setAttribute('type', 'text/css');
    style.appendChild(textnode);
    document.head.appendChild(style);
    /* eslint-enable no-var */
  }, disableAnimationsStyles);
}

export async function getBrowser(config: Config, browserConfig: BrowserConfig): Promise<WebDriver> {
  const {
    gridUrl = config.gridUrl,
    storybookUrl: address = config.storybookUrl,
    limit,
    testRegex,
    viewport,
    ...capabilities
  } = browserConfig;
  void limit;
  void testRegex;
  let realAddress = address;
  if (LOCALHOST_REGEXP.test(address)) {
    realAddress = address.replace(LOCALHOST_REGEXP, await getRealIp());
  }
  const browser = await new Builder()
    .usingServer(gridUrl)
    .withCapabilities(capabilities)
    .build();

  if (viewport) {
    await resizeViewport(browser, viewport);
  }
  try {
    await browser.get(`${realAddress}/iframe.html`);
    await browser.wait(until.elementLocated(By.css('#root')), 10000);
  } catch (_) {
    throw new Error(`Cann't load storybook root page by URL ${realAddress}/iframe.html`);
  }
  await disableAnimations(browser);

  return browser;
}

export async function switchStory(this: Context): Promise<StoryContext> {
  let testOrSuite: Test | Suite | undefined = this.currentTest;

  this.testScope.length = 0;
  this.testScope.push(this.browserName);
  while (testOrSuite && testOrSuite.title) {
    this.testScope.push(testOrSuite.title);
    testOrSuite = testOrSuite.parent;
  }
  // `kindSuite -> storySuite -> test`
  // `kindSuite -> storyTest`
  // TODO If story or kind is undefined should throw error
  const [, test] = this.testScope;
  let [, , story, kind] = this.testScope;

  if (!kind) {
    kind = story;
    story = test;
  }

  await resetMousePosition(this.browser);
  const storyContext = await selectStory(this.browser, kind, story);

  this.testScope.reverse();

  return storyContext;
}

function deserializeRegExp(regex: string): RegExp | null {
  const fragments = /\/(.*?)\/([a-z]*)?$/i.exec(regex);

  if (!fragments) return null;

  const [, pattern, flags] = fragments;

  return new RegExp(pattern, flags || '');
}

function matchBy(pattern: string | string[] | RegExp | undefined, value: string): boolean {
  return (
    (typeof pattern == 'string' && (deserializeRegExp(pattern) || new RegExp(`^${pattern}$`)).test(value)) ||
    (Array.isArray(pattern) && pattern.includes(value)) ||
    !isDefined(pattern)
  );
}

export function shouldSkip(story: CreeveyStory, browser: string, skipOptions: SkipOptions): string | boolean {
  if (typeof skipOptions == 'string') {
    return skipOptions;
  }
  if (Array.isArray(skipOptions)) {
    return skipOptions.map(skipOption => shouldSkip(story, browser, skipOption)).find(Boolean) || false;
  }
  const { in: browsers, stories, kinds, reason = true } = skipOptions;
  const skipByBrowser = matchBy(browsers, browser);
  const skipByKind = matchBy(kinds, story.kind);
  const skipByStory = matchBy(stories, story.name);

  return skipByBrowser && skipByKind && skipByStory && reason;
}
