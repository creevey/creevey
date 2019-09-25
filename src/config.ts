import fs from "fs";
import path from "path";
import { extensions, Extension } from "interpret";
import { Context } from "mocha";
import { switchStory, getBrowser } from "./utils";
import { Config, Browser, BrowserConfig } from "./types";

export const defaultConfig: Omit<Config, "gridUrl" | "testDir"> = {
  storybookUrl: "http://localhost:6006",
  testRegex: /\.(t|j)s$/,
  screenDir: path.resolve("images"),
  reportDir: path.resolve("report"),
  maxRetries: 0,
  threshold: 0,
  browsers: { chrome: true }
};

function registerCompiler(moduleDescriptor: Extension | null) {
  if (moduleDescriptor) {
    if (typeof moduleDescriptor === "string") {
      require(moduleDescriptor);
    } else if (!Array.isArray(moduleDescriptor)) {
      moduleDescriptor.register(require(moduleDescriptor.module));
    } else {
      moduleDescriptor.find(extension => {
        try {
          registerCompiler(extension);
          return true;
        } catch (e) {
          // do nothing
        }
      });
    }
  }
}

function normalizeBrowserConfig(name: string, config: Browser): BrowserConfig {
  if (typeof config == "boolean") return { browserName: name };
  if (typeof config == "string") return { browserName: config };
  return config;
}

export function readConfig(configPath: string): Config | undefined {
  let ext = path.extname(configPath);
  if (ext == ".config") {
    ext = Object.keys(extensions).find(key => fs.existsSync(`${configPath}${key}`)) || ext;
  }
  registerCompiler(extensions[ext]);

  if (!fs.existsSync(require.resolve(configPath))) return;

  const configModule = require(configPath);
  const userConfig: Config = configModule && configModule.__esModule ? configModule.default : configModule;
  const config = { ...defaultConfig, ...userConfig };

  Object.entries(config.browsers).forEach(
    ([browser, browserConfig]) => (config.browsers[browser] = normalizeBrowserConfig(browser, browserConfig))
  );

  if (!config.hooks) {
    config.hooks = {
      async beforeAll(this: Context) {
        const { config, browserName } = this;
        const browserConfig = config.browsers[browserName] as BrowserConfig;
        this.browser = await getBrowser(config, browserConfig);
      },
      beforeEach: switchStory
    };
  }

  return config;
}
