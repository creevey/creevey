import React from 'react';
import { Story } from '@storybook/react';
import { clickTests } from './tests/click';

export default {
  title: 'KindA',
};

export const StoryA: Story = () => <div />;

export const StoryB: Story = () => <div />
StoryB.parameters = {
  creevey: {
    tests: clickTests
  }
}
