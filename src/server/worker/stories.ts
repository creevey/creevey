import { expect } from "chai";
import { Suite, Context, Test } from "mocha";
import { By, WebDriver } from "selenium-webdriver";
import { StoriesRaw, WithCreeveyParameters, SkipOptions, isDefined } from "../../types";

function takeScreenshot(browser: WebDriver, captureElement?: string) {
  if (!captureElement) return browser.takeScreenshot();
  return browser.findElement(By.css(captureElement)).takeScreenshot();
}

function storyTestFabric(creeveyParams: WithCreeveyParameters) {
  return async function storyTest(this: Context) {
    const screenshot = await takeScreenshot(this.browser, creeveyParams.captureElement);
    await expect(screenshot).to.matchImage("idle");
  };
}

function shouldSkip(story: string, browser: string, skipOptions: SkipOptions): string | boolean {
  if (typeof skipOptions == "string") {
    return skipOptions;
  }
  if (Array.isArray(skipOptions)) {
    return skipOptions.map(skipOption => shouldSkip(story, browser, skipOption)).find(isDefined) || false;
  }
  const { in: browsers, stories, reason = true } = skipOptions;
  const skipByBrowser =
    (typeof browsers == "string" && browsers == browser) ||
    (Array.isArray(browsers) && browsers.includes(browser)) ||
    (browsers instanceof RegExp && browsers.test(browser)) ||
    true;
  const skipByStory =
    (typeof stories == "string" && stories == story) ||
    (Array.isArray(stories) && stories.includes(story)) ||
    (stories instanceof RegExp && stories.test(story)) ||
    true;

  return skipByBrowser && skipByStory && reason;
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
    const storyTest = new Test(story.name, storyTestFabric(creeveyParams));
    storyTest.pending = Boolean(skipReason);
    // NOTE Can't define skip reason in mocha https://github.com/mochajs/mocha/issues/2026
    storyTest.skipReason = skipReason;

    storySuite.addTest(storyTest);
  });
}
