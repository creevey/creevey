import { Meta, StoryObj } from '@storybook/react';
import { PageFooter } from '../src/client/shared/components/PageFooter/PageFooter.js';
import { noop } from '../src/types.js';

const Kind: Meta<typeof PageFooter> = {
  title: 'PageFooter',
  component: PageFooter,
  args: {
    onRetryChange: noop,
    retriesCount: 10,
    retry: 1,
  },
};

export default Kind;

export const Simple: StoryObj<typeof PageFooter> = {};
