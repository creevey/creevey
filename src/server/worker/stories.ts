import { PNG } from "pngjs";
import { expect } from "chai";
import { Suite, Context, Test } from "mocha";
import { By, WebDriver } from "selenium-webdriver";
import { StoriesRaw, WithCreeveyParameters } from "../../types";
import { shouldSkip } from "../../utils";

const HideScrollStyleSheet = `
html {
  overflow: -moz-scrollbars-none;
  -ms-overflow-style: none;
}
html::-webkit-scrollbar {
  width: 0;
  height: 0;
}
`;

async function hideBrowserScroll(browser: WebDriver) {
  // @ts-ignore
  await browser.executeScript(function(stylesheet) {
    var style = document.createElement("style");
    var textnode = document.createTextNode(stylesheet);
    style.setAttribute("type", "text/css");
    style.appendChild(textnode);
    document.head.appendChild(style);
    // @ts-ignore
    window.__CREEVEY_RESTORE_SCROLL__ = function() {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      // @ts-ignore
      delete window.__CREEVEY_RESTORE_SCROLL__;
    };
  }, HideScrollStyleSheet);

  return () =>
    browser.executeScript(function() {
      // @ts-ignore
      if (window.__CREEVEY_RESTORE_SCROLL__) {
        // @ts-ignore
        window.__CREEVEY_RESTORE_SCROLL__();
      }
    });
}

async function takeCompositeScreenshot(
  browser: WebDriver,
  windowSize: { width: number; height: number },
  elementRect: DOMRect
) {
  const screens = [];
  const cols = Math.ceil(elementRect.width / windowSize.width);
  const rows = Math.ceil(elementRect.height / windowSize.height);
  const isFitHorizontally = windowSize.width >= elementRect.width + elementRect.left;
  const isFitVertically = windowSize.height >= elementRect.height + elementRect.top;
  const xOffset = isFitHorizontally ? elementRect.left : Math.max(0, cols * windowSize.width - elementRect.width);
  const yOffset = isFitVertically ? elementRect.top : Math.max(0, rows * windowSize.height - elementRect.height);
  const restoreScroll = await hideBrowserScroll(browser);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const dx = Math.min(windowSize.width * col + elementRect.left, Math.max(0, elementRect.right - windowSize.width));
      const dy = Math.min(
        windowSize.height * row + elementRect.top,
        Math.max(0, elementRect.bottom - windowSize.height)
      );
      await browser.executeScript(
        // @ts-ignore
        function(x, y) {
          window.scrollTo(x, y);
        },
        dx,
        dy
      );
      screens.push(await browser.takeScreenshot());
    }
  }
  await restoreScroll();

  const images = screens.map(s => Buffer.from(s, "base64")).map(b => PNG.sync.read(b));
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
  return PNG.sync.write(compositeImage).toString("base64");
}

async function takeScreenshot(browser: WebDriver, captureElement?: string) {
  if (!captureElement) return browser.takeScreenshot();

  const { elementRect, windowSize } = await browser.executeScript(function(selector: string) {
    return {
      elementRect: document.querySelector(selector)!.getBoundingClientRect(),
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    };
  }, captureElement);

  if (
    elementRect.width + elementRect.left > windowSize.width ||
    elementRect.height + elementRect.top > windowSize.height
  ) {
    return takeCompositeScreenshot(browser, windowSize, elementRect);
  }

  return browser.findElement(By.css(captureElement)).takeScreenshot();
}

function storyTestFabric(creeveyParams: WithCreeveyParameters) {
  return async function storyTest(this: Context) {
    const screenshot = await takeScreenshot(this.browser, creeveyParams.captureElement);
    await expect(screenshot).to.matchImage("idle");
  };
}

export function convertStories(rootSuite: Suite, browserName: string, stories: StoriesRaw) {
  Object.values(stories).forEach(story => {
    const creeveyParams = story.parameters.creevey as WithCreeveyParameters;
    const skipReason = creeveyParams.skip ? shouldSkip(story.name, browserName, creeveyParams.skip) : false;

    let kindSuite = rootSuite.suites.find(kindSuite => kindSuite.title == story.kind);
    if (!kindSuite) {
      kindSuite = new Suite(story.kind, rootSuite.ctx);
      kindSuite.parent = rootSuite;
      rootSuite.addSuite(kindSuite);
    }
    // TODO Maybe we need simplify tests tree
    // rootSuite -> kindSuite -> storyTest -> [browsers.png]
    // rootSuite -> kindSuite -> storyTest -> browser -> [images.png]
    // rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
    // rootSuite -> kindSuite -> storySuite -> test -> browser -> [images.png]
    let storySuite = kindSuite.suites.find(storySuite => storySuite.title == story.name);
    if (!storySuite) {
      storySuite = new Suite(story.name, kindSuite.ctx);
      storySuite.parent = kindSuite;
      kindSuite.addSuite(storySuite);
    }
    // TODO params from storybook 3.x - 5.x
    // TODO add tests with actions
    // TODO Check if test already exists
    const storyTest = new Test(story.name, skipReason ? undefined : storyTestFabric(creeveyParams));
    storyTest.pending = Boolean(skipReason);
    // NOTE Can't define skip reason in mocha https://github.com/mochajs/mocha/issues/2026
    storyTest.skipReason = skipReason;

    storySuite.addTest(storyTest);
  });
}
