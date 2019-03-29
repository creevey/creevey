import path from "path";
import http from "http";
import { Context } from "mocha";
import { Builder, until, By } from "selenium-webdriver";
import { Config } from "./types";

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

export async function getBrowser(config: Config, browserName: string) {
  const { gridUrl, address, browsers } = config;
  const capabilities = browsers[browserName];
  const browser = await new Builder()
    .usingServer(gridUrl)
    .withCapabilities(capabilities)
    .build();

  if (address.host === "localhost") {
    address.host = await getRealIp();
  }

  const hostUrl = `http://${address.host}:${address.port}/${address.path}`;
  const storybookQuery = "selectedKind=All&selectedStory=Stories";

  await browser.get(`${hostUrl}?${storybookQuery}`);
  await browser.wait(until.elementLocated(By.css("#root")), 10000);

  return browser;
}

export async function switchStory(this: Context) {
  // TODO add checks and good error messages
  const test = this.currentTest!.title;
  const story = this.currentTest!.parent!.title;
  const kind = this.currentTest!.parent!.parent!.title;

  await this.browser.executeScript(
    // tslint:disable
    // @ts-ignore
    function(kind, story) {
      window.scrollTo(0, 0);
      // @ts-ignore
      window.renderStory({
        kind: kind,
        story: story
      });
      // tslint:enable
    },
    kind,
    story
  );

  this.testScope.length = 0;
  this.testScope.push(this.browserName, kind, story, test);
}

const defaultConfig = {
  testDir: path.resolve("tests"),
  screenDir: path.resolve("images"),
  reportDir: path.resolve("report"),
  maxRetries: 1
};
const defaultBrowserConfig = { limit: 1 };

export function readConfig(configPath: string): Config {
  const configModule = require(configPath);
  const userConfig: Config = configModule && configModule.__esModule ? configModule.default : configModule;
  const config = { ...defaultConfig, ...userConfig };

  Object.values(config.browsers).forEach(browserConfig => Object.assign(browserConfig, defaultBrowserConfig));

  if (!config.hooks) {
    config.hooks = {
      async beforeAll(this: Context) {
        const { config, browserName } = this;
        this.browser = await getBrowser(config, browserName);
      },
      beforeEach: switchStory
    };
  }

  return config;
}
