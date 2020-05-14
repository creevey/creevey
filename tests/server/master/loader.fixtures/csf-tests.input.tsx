import React from 'react';

export default {
  title: 'Button',
  parameters: {
    creevey: {
      skip: {
        in: 'ie11',
        stories: 'Text',
        reason: 'Internet Explorer is not supported yet',
      },
    },
  },
};

export const Text = () => <button>Hello Button</button>;
Text.story = {
  parameters: {
    creevey: {
      captureElement: 'button',
      delay: 1000,
      tests: {
        async click() {
          await this.browser.actions().click(this.captureElement).perform();

          await this.expect(await this.takeScreenshot()).to.matchImage('clicked button');
        },
      },
    },
  },
};