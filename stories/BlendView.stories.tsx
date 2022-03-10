import { Meta, Story } from '@storybook/react';
import React from 'react';
import { ImagesView as ImagesViewBase } from '../src/client/shared/components/ImagesView';

const BlendView = (image: { expect: string; diff: string; actual: string }): JSX.Element => (
  <ImagesViewBase image={image} url="https://images.placeholders.dev" canApprove mode={'blend'} />
);

export default {
  title: 'BlendView',
  parameters: {
    creevey: {
      kind: {
        waitForReady: true,
        captureElement: '#root > *',
      },
    },
  },
} as Meta;

export const _100x100_vs_100x100: Story = () => (
  <BlendView expect={'?width=100&height=100'} diff={'?width=100&height=100'} actual={'?width=100&height=100'} />
);
export const _100x100_vs_2000x100: Story = () => (
  <BlendView expect={'?width=100&height=100'} diff={'?width=2000&height=100'} actual={'?width=2000&height=100'} />
);
export const _100x100_vs_100x2000: Story = () => (
  <BlendView expect={'?width=100&height=100'} diff={'?width=100&height=2000'} actual={'?width=100&height=2000'} />
);
export const _100x100_vs_2000x2000: Story = () => (
  <BlendView expect={'?width=100&height=100'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
export const _2000x100_vs_100x2000: Story = () => (
  <BlendView expect={'?width=2000&height=100'} diff={'?width=2000&height=2000'} actual={'?width=100&height=2000'} />
);
export const _2000x100_vs_2000x2000: Story = () => (
  <BlendView expect={'?width=2000&height=100'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
export const _100x2000_vs_2000x2000: Story = () => (
  <BlendView expect={'?width=100&height=2000'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
export const _2000x2000_vs_2000x2000: Story = () => (
  <BlendView expect={'?width=2000&height=2000'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
