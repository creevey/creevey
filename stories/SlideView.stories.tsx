import React from 'react';
import { ComponentMeta, ComponentStoryObj } from '@storybook/react';
import { fireEvent, within } from '@storybook/testing-library';
import { ImagesView as ImagesViewBase } from '../src/client/shared/components/ImagesView';
import { capture } from '../src/client/addon';

const SlideView = (image: { expect: string; diff: string; actual: string }): JSX.Element => (
  <ImagesViewBase image={image} url="https://images.placeholders.dev" canApprove mode={'slide'} />
);

async function play({
  canvasElement,
}: Parameters<NonNullable<ComponentStoryObj<typeof SlideView>['play']>>['0']): Promise<void> {
  await capture({ imageName: 'idle' });

  const slider = await within(canvasElement).findByTestId('slider');
  fireEvent.change(slider, { target: { value: 50 } });

  await capture({ imageName: 'click' });
}

export default {
  title: 'SlideView',
  component: SlideView,
  parameters: {
    creevey: {
      waitForReady: true,
      captureElement: '#root > *',
    },
  },
} as ComponentMeta<typeof SlideView>;

export const _100x100_vs_100x100: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=100&height=100',
    diff: '?width=100&height=100',
    actual: '?width=100&height=100',
  },
};

export const _100x100_vs_2000x100: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=100&height=100',
    diff: '?width=2000&height=100',
    actual: '?width=2000&height=100',
  },
};

export const _100x100_vs_100x2000: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=100&height=100',
    diff: '?width=100&height=2000',
    actual: '?width=100&height=2000',
  },
};

export const _100x100_vs_2000x2000: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=100&height=100',
    diff: '?width=2000&height=2000',
    actual: '?width=2000&height=2000',
  },
};

export const _2000x100_vs_100x2000: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=2000&height=100',
    diff: '?width=2000&height=2000',
    actual: '?width=100&height=2000',
  },
};

export const _2000x100_vs_2000x2000: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=2000&height=100',
    diff: '?width=2000&height=2000',
    actual: '?width=2000&height=2000',
  },
};

export const _100x2000_vs_2000x2000: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=100&height=2000',
    diff: '?width=2000&height=2000',
    actual: '?width=2000&height=2000',
  },
};

export const _2000x2000_vs_2000x2000: ComponentStoryObj<typeof SlideView> = {
  play,
  args: {
    expect: '?width=2000&height=2000',
    diff: '?width=2000&height=2000',
    actual: '?width=2000&height=2000',
  },
};
