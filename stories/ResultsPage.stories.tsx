import { Meta, StoryObj } from '@storybook/react';
import { ResultsPage } from '../src/client/shared/components/ResultsPage';
import { noop } from '../src/types.js';

const Kind: Meta<typeof ResultsPage> = {
  title: 'ResultsPage',
  component: ResultsPage,
  args: {
    onImageApprove: noop,
    id: 'chrome',
    path: ['chrome'],
    showTitle: true,
    results: [{ status: 'failed' }],
  },
};

export default Kind;

export const Simple: StoryObj<typeof ResultsPage> = {};
