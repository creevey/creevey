import { expect } from "chai";
import { By } from "selenium-webdriver";

// TODO Types?
// TODO add selenium-react-testing
describe("ImagesView", function() {
  describe("BlendView", function() {
    it("idle", async function() {
      const element = await this.browser.findElement(By.css("#root"));
      // @ts-ignore
      await expect(await element.takeScreenshot()).to.matchImage("idle");
    });
  });
});
