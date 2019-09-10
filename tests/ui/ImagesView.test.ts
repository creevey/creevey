import { expect } from "chai";
import { By } from "selenium-webdriver";

// TODO add selenium-react-testing
describe("ImagesView", function() {
  describe("BlendView", function() {
    it("idle", async function() {
      const element = await this.browser.findElement(By.css("#root"));
      await expect(await element.takeScreenshot()).to.matchImage("idle");
    });
  });
});
