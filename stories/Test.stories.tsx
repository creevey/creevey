import { ComponentMeta, ComponentStoryObj } from '@storybook/react';
import React from 'react';

import { CreeveyStoryParams } from '../src/types';

const TestComponent: React.FC = () => <span data-test-id="x">TEST</span>;

export default {
  title: 'TestKind',
  component: TestComponent,
  parameters: {
    creevey: {
      captureElement: '#root',
    },
  },
} as ComponentMeta<typeof TestComponent>;

export const Story: ComponentStoryObj<typeof TestComponent> = {
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
