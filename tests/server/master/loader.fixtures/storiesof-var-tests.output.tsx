// @ts-nocheck

import { storiesOf } from '@storybook/react';

const buttonTests = (captureElement) => ({
  async click() {
    await this.browser.actions().click(captureElement).perform();

    await this.expect(await this.takeScreenshot()).to.matchImage('clicked button');
  } });


storiesOf('Button', module).
add('Text', () => {}, {
  creevey: {
    delay: 1000,
    tests: buttonTests('button') } });