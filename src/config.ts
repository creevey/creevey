import path from "path";
import { Context } from "mocha";
import { switchStory, getBrowser } from "./utils";
import { Config } from "./types";

export const defaultConfig = {
  testRegex: "\\.js$",
  testDir: path.resolve("tests"),
  screenDir: path.resolve("images"),
  reportDir: path.resolve("report"),
  maxRetries: 0,
  threshold: 0
};
const defaultBrowserConfig = { limit: 1 };

export function readConfig(configPath: string): Config {
  const configModule = require(configPath);
  const userConfig: Config = configModule && configModule.__esModule ? configModule.default : configModule;
  const config = { ...defaultConfig, ...userConfig };

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = { ...defaultBrowserConfig, ...browserConfig })
  );

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
