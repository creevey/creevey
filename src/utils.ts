import http from "http";
import { Context } from "mocha";
import { Builder, By, until, WebDriver } from "selenium-webdriver";
import { Config } from "./types";
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

async function selectStory(browser: WebDriver, kind: string, story: string) {
  const storyContext: StoryContext = await browser.executeAsyncScript(
    // @ts-ignore
    function(storyId, kind, name, callback) {
      // @ts-ignore
      window.selectStory(storyId, kind, name, callback);
    },
    `${kind}--${story}`.toLowerCase(),
    kind,
    story
  );
  return storyContext;
}

export async function getBrowser(config: Config, browserName: string) {
  const { browsers } = config;
  const {
    gridUrl = config.gridUrl,
    address = config.address,
    limit,
    testRegex,
    resolution,
    ...capabilities
  } = browsers[browserName];
  const browser = await new Builder()
    .usingServer(gridUrl)
    .withCapabilities(capabilities)
    .build();

  if (address.host === "localhost" || address.host === "127.0.0.1") {
    address.host = await getRealIp();
  }

  if (resolution) {
    await browser
      .manage()
      .window()
      .setRect(resolution);
  }
  await browser.get(`http://${address.host}:${address.port}/${address.path}`);
  await browser.wait(until.elementLocated(By.css("#root")), 10000);

  return browser;
}

export async function switchStory(this: Context) {
  // TODO add checks and good error messages
  const test = this.currentTest!.title;
  const story = this.currentTest!.parent!.title;
  const kind = this.currentTest!.parent!.parent!.title;

  await resetMousePosition(this.browser);
  const storyContext = await selectStory(this.browser, kind, story);

  this.testScope.length = 0;
  this.testScope.push(kind, story, test, this.browserName);

  return storyContext;
}
