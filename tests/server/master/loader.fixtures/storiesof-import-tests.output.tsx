// @ts-nocheck

import { storiesOf } from '@storybook/react';
import { delay } from './src/utils';

storiesOf('Button', module).
add('Text', () => {}, {
  creevey: {
    captureElement: 'button',
    tests: {
      async click() {
        await this.browser.actions().click(this.captureElement).perform();

        await delay(1000);

        await this.expect(await this.takeScreenshot()).to.matchImage('clicked button');
      } } } });