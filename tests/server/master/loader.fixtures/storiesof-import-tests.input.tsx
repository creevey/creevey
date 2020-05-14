// @ts-nocheck
import React from 'react';
import { storiesOf } from '@storybook/react';
import { delay } from './src/utils';

storiesOf('Button', module)
  .add('Text', () => <button>Hello Button</button>, {
    creevey: {
      captureElement: 'button',
      tests: {
        async click() {
          await this.browser.actions().click(this.captureElement).perform();

          await delay(1000);

          await this.expect(await this.takeScreenshot()).to.matchImage('clicked button');
        },
      },
    },
  });