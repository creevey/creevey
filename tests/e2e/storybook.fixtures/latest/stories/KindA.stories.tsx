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
