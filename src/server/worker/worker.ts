import chai from "chai";
import chalk from "chalk";
import Mocha, { Suite, Context, AsyncFunc } from "mocha";
import { Config, Images, Options, StoriesRaw, BrowserConfig } from "../../types";
import { getBrowser, switchStory } from "../../utils";
import chaiImage from "../../chai-image";
import { Loader } from "../../loader";
import { CreeveyReporter, TeamcityReporter } from "./reporter";
import { convertStories } from "./stories";

// After end of each suite mocha clean all hooks and don't allow re-run tests without full re-init
// @ts-ignore see issue for more info https://github.com/mochajs/mocha/issues/2783
Suite.prototype.cleanReferences = () => {};

function patchMochaInterface(suite: Suite) {
  suite.on("pre-require", context => {
    // @ts-ignore
    context.it.skip = (_browsers: string[], title: string, fn?: AsyncFunc) => context.it(title, fn);
  });
}

// FIXME browser options hotfix
export default async function worker(config: Config, options: Options & { browser: string }) {
  function saveImageHandler(imageName: string, imageNumber: number, type: keyof Images) {
    const image = (images[imageName] = images[imageName] || {});
    image[type] = `${imageName}-${type}-${imageNumber}.png`;
  }

  function runHandler(failures: number) {
    if (process.send) {
      if (failures > 0) {
        const isTimeout = typeof error == "string" && error.toLowerCase().includes("timeout");
        process.send(
          JSON.stringify({ type: isTimeout ? "error" : "test", payload: { status: "failed", images, error } })
        );
      } else {
        process.send(JSON.stringify({ type: "test", payload: { status: "success", images } }));
      }
    }
    // TODO Should we move into `process.on`?
    images = {};
    error = null;
  }

  let retries: number = 0;
  let images: Partial<{ [name: string]: Partial<Images> }> = {};
  let error: any = null;
  const testScope: string[] = [];
  const mocha = new Mocha({
    timeout: 30000,
    reporter: process.env.TEAMCITY_VERSION ? TeamcityReporter : options.reporter || CreeveyReporter,
    reporterOptions: {
      topLevelSuite: options.browser,
      willRetry: () => retries < config.maxRetries,
      images: () => images
    }
  });
  const browserConfig = config.browsers[options.browser] as BrowserConfig;
  const browser = await getBrowser(config, browserConfig);
  // @ts-ignore
  const stories: StoriesRaw = await browser.executeAsyncScript(function(callback) {
    // @ts-ignore
    window.__CREEVEY_GET_STORIES__(callback);
  });

  chai.use(chaiImage(config, testScope, saveImageHandler));

  if (config.testDir) await new Loader(config.testRegex, filePath => mocha.addFile(filePath)).loadTests(config.testDir);

  convertStories(mocha.suite, options.browser, stories);

  mocha.suite.beforeAll(function(this: Context) {
    this.config = config;
    this.browser = browser;
    this.browserName = options.browser;
    this.testScope = testScope;
  });
  // TODO Handle story context
  mocha.suite.beforeEach(switchStory);
  patchMochaInterface(mocha.suite);

  process.on("unhandledRejection", reason => {
    if (process.send) {
      error = reason instanceof Error ? reason.stack || reason.message : reason;
      console.log(`[${chalk.red("FAIL")}:${options.browser}:${process.pid}]`, chalk.cyan(testScope.join("/")), error);
      process.send(JSON.stringify({ type: "error", payload: { status: "failed", images, error } }));
    }
  });

  process.on("message", message => {
    const test: { id: string; path: string[]; retries: number } = JSON.parse(message);
    retries = test.retries;
    const testPath = [...test.path]
      .reverse()
      .join(" ")
      .replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");

    mocha.grep(new RegExp(`^${testPath}$`));
    const runner = mocha.run(runHandler);

    // TODO How handle browser corruption?
    runner.on("fail", (_test, reason) => (error = reason instanceof Error ? reason.stack || reason.message : reason));
  });

  setInterval(() => browser.getTitle(), 30 * 1000);

  console.log("[CreeveyWorker]:", `Ready ${options.browser}:${process.pid}`);

  if (process.send) {
    process.send(JSON.stringify({ type: "ready", payload: { stories } }));
  }
}
