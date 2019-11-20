import React from "react";
import Chai from "chai";
import Mocha from "mocha";
import Selenium from "selenium-webdriver";

import { BlendView, SideBySideView, SlideView, SwapView } from "../src/client/ImagesView";

import octocatExpect from "./fixtures/octocat-expect.png";
import octocatDiff from "./fixtures/octocat-diff.png";
import octocatActual from "./fixtures/octocat-actual.png";

export default {
  title: "ImagesViews",
  parameters: {
    creevey: {
      skip: { in: ["firefox", "ie11"], reason: "Only Chrome is supporter" },
      __filename
    }
  }
};

export const Blend = () => <BlendView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;
export const SideBySide = () => <SideBySideView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;
export const Slide = () => <SlideView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;
export const Swap = () => <SwapView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;

Slide.story = {
  parameters: {
    creevey: {
      _seleniumTests({ By }: typeof Selenium, { expect }: typeof Chai) {
        return {
          async idle(this: Mocha.Context) {
            const element = await this.browser.findElement(By.css("#root"));
            await expect(await element.takeScreenshot()).to.matchImage();
          },
          async click(this: Mocha.Context) {
            const element = await this.browser.findElement(By.css("#root"));

            await this.browser
              .actions({ bridge: true })
              .click(element)
              .perform();

            await expect(await element.takeScreenshot()).to.matchImage();
          }
        };
      }
    }
  }
};
