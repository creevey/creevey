import React from 'react';
import { Story } from '@storybook/react';
import { CreeveyStoryParams } from 'creevey';
import { clickTests } from './tests/click';

export default {
  title: 'KindA',
};

export const ImportedTests: Story = () => <div />
ImportedTests.parameters = {
  creevey: {
    tests: clickTests
  }
}

export const SkippedTests: Story = () => <div />
SkippedTests.parameters = {
  creevey: {
    skip: [{
      in: 'browser',
      tests: ['testB']
    }]
  }
}

export const DynamicStoryTests: Story = (props: { content?: string }) => <div>{props.content}</div>
DynamicStoryTests.args = {
  content: 'default'
}

DynamicStoryTests.parameters = {
  creevey: {
    tests: {
      async updateArgs() {
        await this.updateStoryArgs({ content: 'test' })
      }
    } as CreeveyStoryParams['tests']
  }
}

export const decorators: Story = () => <div />
export const parameters: Story = () => <div />
