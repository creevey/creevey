import { Meta, StoryObj } from '@storybook/react-vite';
import { ResultsPage } from '../src/client/shared/components/ResultsPage.js';

const Kind: Meta<typeof ResultsPage> = {
  component: ResultsPage,
  args: {
    path: ['chrome'],
    showTitle: true,
    results: [{ status: 'failed', retries: 0 }],
  },
};

export default Kind;

export const Simple: StoryObj<typeof ResultsPage> = {};
