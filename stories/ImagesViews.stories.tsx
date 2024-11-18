import React, { JSX } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { fireEvent, within } from '@storybook/test';

import { capture } from '../src/client/addon/index.js';
import { ImagesView as ImagesViewBase } from '../src/client/shared/components/ImagesView/index.js';
import { ImagesViewMode } from '../src/types.js';

import octocatExpect from './fixtures/octocat-expect.png';
import octocatDiff from './fixtures/octocat-diff.png';
import octocatActual from './fixtures/octocat-actual.png';

const ImagesView = ({ mode }: { mode: ImagesViewMode }): JSX.Element => (
  <ImagesViewBase image={{ expect: octocatExpect, diff: octocatDiff, actual: octocatActual }} canApprove mode={mode} />
);

const Kind: Meta<typeof ImagesView> = { title: 'ImagesViews', component: ImagesView };

export default Kind;

export const SideBySide: StoryObj<typeof ImagesView> = {
  args: { mode: 'side-by-side' },
  // TODO Some async updates in component might not be waited
  parameters: { creevey: { waitForReady: true, delay: 100 } },
};

export const Swap: StoryObj<typeof ImagesView> = {
  args: { mode: 'swap' },
  parameters: { creevey: { waitForReady: true } },
};

export const Slide: StoryObj<typeof ImagesView> = {
  args: { mode: 'slide' },
  parameters: { creevey: { waitForReady: true } },
  async play({ canvasElement }) {
    await capture({ imageName: 'idle' });

    const slider = await within(canvasElement).findByTestId('slider');
    await fireEvent.change(slider, { target: { value: 50 } });

    await capture({ imageName: 'click' });
  },
};

export const Blend: StoryObj<typeof ImagesView> = { args: { mode: 'blend' } };

export const Diff: StoryObj<typeof ImagesView> = { args: { mode: 'diff' } };
