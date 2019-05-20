import chai from "chai";
import Mocha, { Suite, Context } from "mocha";
import { Config, Test, Images } from "../../types";
import { getBrowser, switchStory } from "../../utils";
import chaiImage from "../../mocha-ui/chai-image";
import { Loader } from "../../loader";

// After end of each suite mocha clean all hooks and don't allow re-run tests without full re-init
// @ts-ignore see issue for more info https://github.com/mochajs/mocha/issues/2783
Suite.prototype.cleanReferences = () => {};

// TODO ui
// TODO onError, unhandlerRejection

export default async function worker(config: Config, browserName: string) {
  function saveImageHandler(imageName: string, imageNumber: number, type: keyof Images) {
    const image = (images[imageName] = images[imageName] || {});
    image[type] = `${imageName}-${type}-${imageNumber}.png`;
  }

  const mocha = new Mocha({ timeout: 30000 });
  const browser = await getBrowser(config, browserName);
  const testScope: string[] = [];
  let images: Partial<{ [name: string]: Partial<Images> }> = {};

  chai.use(chaiImage(config, testScope, saveImageHandler));

  await new Loader(config.testRegex, filePath => mocha.addFile(filePath)).loadTests(config.testDir);

  mocha.suite.beforeAll(function(this: Context) {
    this.config = config;
    this.browser = browser;
    this.browserName = browserName;
    this.testScope = testScope;
  });
  mocha.suite.beforeEach(switchStory);

  // TODO Custom reporter => collect fail results => on end send fail results

  process.on("message", message => {
    const test: Test = JSON.parse(message);
    const testPath = [...test.path].reverse().join(" ");

    console.log(browserName, testPath);

    mocha.grep(new RegExp(`^${testPath}$`));
    mocha.run(failures => {
      if (process.send) {
        if (failures > 0) {
          process.send(JSON.stringify({ status: "failed", images }));
        } else {
          process.send(JSON.stringify({ status: "success", images }));
        }
      }
      images = {};
    });
  });

  setInterval(() => browser.getTitle(), 30 * 1000);

  console.log(browserName, "ready");
}
