import React from 'react';
import { ComponentMeta, ComponentStoryObj } from '@storybook/react';
import { fireEvent, within } from '@testing-library/dom';

import { capture } from '../src/client/addon';
import { ImagesView as ImagesViewBase } from '../src/client/shared/components/ImagesView';
import { ImagesViewMode } from '../src/types';

import octocatExpect from './fixtures/octocat-expect.png';
import octocatDiff from './fixtures/octocat-diff.png';
import octocatActual from './fixtures/octocat-actual.png';

const ImagesView = ({ mode }: { mode: ImagesViewMode }): JSX.Element => (
  <ImagesViewBase
    image={{ expect: octocatExpect, diff: octocatDiff, actual: octocatActual }}
    url=""
    canApprove
    mode={mode}
  />
);

export default { title: 'ImagesViews', component: ImagesView } as ComponentMeta<typeof ImagesView>;

export const SideBySide: ComponentStoryObj<typeof ImagesView> = { args: { mode: 'side-by-side' } };

export const Swap: ComponentStoryObj<typeof ImagesView> = {
  args: { mode: 'swap' },
  parameters: { creevey: { waitForReady: true } },
};

export const Slide: ComponentStoryObj<typeof ImagesView> = {
  args: { mode: 'slide' },
  parameters: { creevey: { waitForReady: true } },
  async play({ canvasElement }) {
    await capture({ imageName: 'idle' });

    const slider = await within(canvasElement).findByTestId('slider');
    fireEvent.change(slider, { target: { value: 50 } });

    await capture({ imageName: 'click' });
  },
};

export const Blend: ComponentStoryObj<typeof ImagesView> = { args: { mode: 'blend' } };
