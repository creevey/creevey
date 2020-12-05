import React from 'react';
import { Story } from '@storybook/react';
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
