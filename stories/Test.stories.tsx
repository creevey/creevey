import { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { CreeveyStoryParams } from '../src/types.js';

const TestComponent: React.FC = () => <span data-test-id="x">TEST</span>;

const Kind: Meta<typeof TestComponent> = {
  title: 'TestKind',
  component: TestComponent,
  parameters: {
    creevey: {
      captureElement: '#storybook-root',
    },
  },
};

export default Kind;

export const Story: StoryObj<typeof TestComponent> = {
  parameters: {
    creevey: {
      captureElement: 'body',
      // tests: {
      //   async idletest() {
      //     await this.expect(await this.takeScreenshot()).to.matchImage('idleimage');
      //   },
      // },
    } as CreeveyStoryParams,
  },
};
