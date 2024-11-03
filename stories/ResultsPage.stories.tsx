import { Meta, StoryObj } from '@storybook/react';
import { ResultsPage } from '../src/client/shared/components/ResultsPage.js';

const Kind: Meta<typeof ResultsPage> = {
  title: 'ResultsPage',
  component: ResultsPage,
  args: {
    path: ['chrome'],
    showTitle: true,
    results: [{ status: 'failed' }],
  },
};

export default Kind;

export const Simple: StoryObj<typeof ResultsPage> = {};
