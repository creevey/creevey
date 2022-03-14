import { Meta, Story } from '@storybook/react';
import { CreeveyMeta } from '../src/types';
import React from 'react';
import { ImagesView as ImagesViewBase } from '../src/client/shared/components/ImagesView';

const SwapView = (image: { expect: string; diff: string; actual: string }): JSX.Element => (
  <ImagesViewBase image={image} url="https://images.placeholders.dev" canApprove mode={'swap'} />
);

export default {
  title: 'SwapView',
  parameters: {
    creevey: {
      waitForReady: true,
      captureElement: '#root > *',
      tests: {
        async click() {
          const actual = await this.takeScreenshot();

          await this.browser.actions().click(this.captureElement).perform();

          const expect = await this.takeScreenshot();

          await this.expect({ actual, expect }).to.matchImages();
        },
      },
    },
  },
} as Meta & CreeveyMeta;

export const _100x100_vs_100x100: Story = () => (
  <SwapView expect={'?width=100&height=100'} diff={'?width=100&height=100'} actual={'?width=100&height=100'} />
);
export const _100x100_vs_2000x100: Story = () => (
  <SwapView expect={'?width=100&height=100'} diff={'?width=2000&height=100'} actual={'?width=2000&height=100'} />
);
export const _100x100_vs_100x2000: Story = () => (
  <SwapView expect={'?width=100&height=100'} diff={'?width=100&height=2000'} actual={'?width=100&height=2000'} />
);
export const _100x100_vs_2000x2000: Story = () => (
  <SwapView expect={'?width=100&height=100'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
export const _2000x100_vs_100x2000: Story = () => (
  <SwapView expect={'?width=2000&height=100'} diff={'?width=2000&height=2000'} actual={'?width=100&height=2000'} />
);
export const _2000x100_vs_2000x2000: Story = () => (
  <SwapView expect={'?width=2000&height=100'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
export const _100x2000_vs_2000x2000: Story = () => (
  <SwapView expect={'?width=100&height=2000'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
export const _2000x2000_vs_2000x2000: Story = () => (
  <SwapView expect={'?width=2000&height=2000'} diff={'?width=2000&height=2000'} actual={'?width=2000&height=2000'} />
);
