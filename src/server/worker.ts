import fs from "fs";
import path from "path";
import chai from "chai";
import Mocha, { Suite, Context } from "mocha";
import { Config } from "../types";
import { getBrowser, switchStory } from "../utils";
import chaiImage from "../mocha-ui/chai-image";

// After end of each suite mocha clean all hooks and don't allow re-run tests without full re-init
// @ts-ignore see issue for more info https://github.com/mochajs/mocha/issues/2783
Suite.prototype.cleanReferences = () => {};

// define chai image
//

// TODO ui

// init browser
// save browser to ctx
// switch story before run
// subscribe
// run tests

export default async function worker(config: Config) {
  const mocha = new Mocha();
  const browserName = process.env.browser as string;
  const browser = await getBrowser(config, browserName);
  const testScope: string[] = [];

  console.log(`Browser for ${browserName} started`);

  chai.use(chaiImage(config, testScope));

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

  process.on("message", message => {
    console.log(browserName, JSON.parse(message));
    const { suites, title } = JSON.parse(message);

    mocha.grep([...suites.reverse(), title].join(" "));
    mocha.run(() => {
      if (process.send) {
        process.send("success");
      }
    });
  });
}
