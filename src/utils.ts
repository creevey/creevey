import http from "http";
import { Context } from "mocha";
import { Builder, By, until, WebDriver } from "selenium-webdriver";
import { Config, BrowserConfig } from "./types";
import { StoryContext } from "@storybook/addons";

function getRealIp(): Promise<string> {
  return new Promise((resolve, reject) =>
    http.get("http://fake.dev.kontur/ip", res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Couldn't resolve real ip for \`localhost\`. Status code: ${res.statusCode}`));
      }

      let data = "";

      res.setEncoding("utf8");
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(data));
    })
  );
}

async function resetMousePosition(browser: WebDriver) {
  const { width, height } = await browser.executeScript(function() {
    // NOTE On storybook >= 4.x already reset scroll
    window.scrollTo(0, 0);

    var bodyRect = document.body.getBoundingClientRect();
    return {
      width: Math.min(document.documentElement.clientWidth, bodyRect.width),
      height: Math.min(document.documentElement.clientHeight, bodyRect.height)
    };
  });
  await browser
    .actions({ bridge: true })
    .move({
      origin: browser.findElement(By.css("body")),
      x: Math.ceil((-1 * width) / 2),
      y: Math.ceil((-1 * height) / 2)
    })
    .perform();
}

async function resizeViewport(browser: WebDriver, viewport: { width: number; height: number }) {
  const windowRect = await browser
    .manage()
    .window()
    .getRect();
  const { innerWidth, innerHeight } = await browser.executeScript(function() {
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    };
  });
  const dWidth = windowRect.width - innerWidth;
  const dHeight = windowRect.height - innerHeight;
  await browser
    .manage()
    .window()
    .setRect({
      width: viewport.width + dWidth,
      height: viewport.height + dHeight
    });
}

async function selectStory(browser: WebDriver, kind: string, story: string) {
  const storyContext: StoryContext = await browser.executeAsyncScript(
    // @ts-ignore
    function(storyId, kind, name, callback) {
      // @ts-ignore
      window.selectStory(storyId, kind, name, callback);
    },
    `${kind}--${story}`.toLowerCase().replace(/\//g, "-"),
    kind,
    story
  );
  return storyContext;
}

export async function getBrowser(config: Config, browserConfig: BrowserConfig) {
  const {
    gridUrl = config.gridUrl,
    address = config.address,
    limit,
    testRegex,
    viewport,
    ...capabilities
  } = browserConfig;
  const realAddress = address.replace(/(localhost|127\.0\.0\.1)/, await getRealIp());
  const browser = await new Builder()
    .usingServer(gridUrl)
    .withCapabilities(capabilities)
    .build();

  if (viewport) {
    await resizeViewport(browser, viewport);
  }
  await browser.get(`${realAddress}/iframe.html`);
  await browser.wait(until.elementLocated(By.css("#root")), 10000);

  return browser;
}

export async function switchStory(this: Context) {
  // TODO add checks and good error messages
  const test = this.currentTest!.title;
  const story = this.currentTest!.parent!.title;
  const kind = this.currentTest!.parent!.parent!.title;
  console.log(kind, story, test);

  await resetMousePosition(this.browser);
  const storyContext = await selectStory(this.browser, kind, story);

  this.testScope.length = 0;
  this.testScope.push(kind, story, test, this.browserName);

  return storyContext;
}
