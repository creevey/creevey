// @ts-nocheck

import { storiesOf } from '@storybook/react';

storiesOf('Button', module).
addParameters({
  creevey: {
    skip: {
      in: 'ie11',
      stories: 'Text',
      reason: 'Internet Explorer is not supported yet' } } }).



add('Text', () => {}, {
  creevey: {
    captureElement: 'button',
    delay: 1000,
    tests: {
      async click() {
        await this.browser.actions().click(this.captureElement).perform();

        await this.expect(await this.takeScreenshot()).to.matchImage('clicked button');
      } } } });