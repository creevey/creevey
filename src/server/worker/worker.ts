import chai from "chai";
import chalk from "chalk";
import Mocha, { Suite, Context, AsyncFunc } from "mocha";
import { Config, Images, Options } from "../../types";
import { getBrowser, switchStory } from "../../utils";
import chaiImage from "../../mocha-ui/chai-image";
import { Loader } from "../../loader";
import { CreeveyReporter, TeamcityReporter } from "./reporter";

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

  const mocha = new Mocha({
    timeout: 30000,
    reporter: process.env.TEAMCITY_VERSION ? TeamcityReporter : options.reporter || CreeveyReporter,
    reporterOptions: {
      topLevelSuite: options.browser,
      willRetry: () => retries < config.maxRetries,
      images: () => images
    }
  });
  const browser = await getBrowser(config, options.browser);
  // @ts-ignore
  const stories = await browser.executeAsyncScript(function(callback) {
    // @ts-ignore
    window.getStories(callback);
  });
  const testScope: string[] = [];
  let retries: number = 0;
  let images: Partial<{ [name: string]: Partial<Images> }> = {};
  let error: any = null;

  chai.use(chaiImage(config, testScope, saveImageHandler));

  await new Loader(config.testRegex, filePath => mocha.addFile(filePath)).loadTests(config.testDir);

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
