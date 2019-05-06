import fs from "fs";
import path from "path";
import chai from "chai";
import Mocha, { Suite, Context } from "mocha";
import { Config, Test, Images } from "../../types";
import { getBrowser, switchStory } from "../../utils";
import chaiImage from "../../mocha-ui/chai-image";

// After end of each suite mocha clean all hooks and don't allow re-run tests without full re-init
// @ts-ignore see issue for more info https://github.com/mochajs/mocha/issues/2783
Suite.prototype.cleanReferences = () => {};

// define chai image
//

// TODO ui
// TODO onError, unhandlerRejection

export default async function worker(config: Config) {
  function saveImageHandler(imageName: string, imageNumber: number, type: keyof Images) {
    const image = (images[imageName] = images[imageName] || {});
    image[type] = `${imageName}-${type}-${imageNumber}.png`;
  }

  const mocha = new Mocha();
  const browserName = process.env.browser as string;
  const browser = await getBrowser(config, browserName);
  const testScope: string[] = [];
  const images: { [name: string]: Partial<Images> | undefined } = {};

  chai.use(chaiImage(config, testScope, saveImageHandler));

  fs.readdirSync(config.testDir).forEach(file => {
    mocha.addFile(path.join(config.testDir, file));
  });

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
    // TODO slice browser
    const testPath = [...test.path.slice(1)].reverse().join(" ");

    console.log(browserName, testPath);

    mocha.grep(testPath);
    mocha.run(failures => {
      if (process.send) {
        if (failures > 0) {
          process.send(JSON.stringify({ status: "failed", images }));
        } else {
          process.send(JSON.stringify({ status: "success", images }));
        }
      }
    });
  });

  setInterval(() => browser.getTitle(), 30 * 1000);

  console.log(browserName, "ready");
}
