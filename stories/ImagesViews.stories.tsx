import React from 'react';
import Chai from 'chai';
import Mocha from 'mocha';
import Selenium from 'selenium-webdriver';

import { ImagesView as ImagesViewBase } from '../src/client/CreeveyView/ImagesView';
import { ImagesViewMode } from '../src/types';

import octocatExpect from './fixtures/octocat-expect.png';
import octocatDiff from './fixtures/octocat-diff.png';
import octocatActual from './fixtures/octocat-actual.png';

export default {
  title: 'ImagesViews',
  parameters: {
    creevey: {
      skip: { in: ['firefox', 'ie11'], reason: 'Only Chrome is supporter' },
      __filename,
    },
  },
};

const ImagesView = (mode: ImagesViewMode) => (
  <ImagesViewBase
    image={{ expect: octocatExpect, diff: octocatDiff, actual: octocatActual }}
    url=""
    canApprove
    mode={mode}
  />
);

export const SideBySide = () => ImagesView('side-by-side');
export const Swap = () => ImagesView('swap');
export const Slide = () => ImagesView('slide');
export const Blend = () => ImagesView('blend');

Slide.story = {
  parameters: {
    creevey: {
      _seleniumTests({ By }: typeof Selenium, { expect }: typeof Chai) {
        return {
          async click(this: Mocha.Context) {
            const element = await this.browser.findElement(By.css('#root'));

            const idle = await element.takeScreenshot();

            await this.browser
              .actions({ bridge: true })
              .click(element)
              .perform();

            const click = await element.takeScreenshot();

            // TODO toMatchImages
            await Promise.all([expect(idle).to.matchImage('idle'), expect(click).to.matchImage('click')]);
          },
        };
      },
    },
  },
};
