import { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from '../src/client/shared/components/PageHeader/PageHeader.js';
import { noop } from '../src/types.js';

const Kind: Meta<typeof PageHeader> = {
  component: PageHeader,
  args: {
    imageName: '',
    onImageChange: noop,
    onViewModeChange: noop,
  },
};

export default Kind;

export const Simple: StoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '1'],
    showViewModes: true,
    viewMode: 'side-by-side',
  },
};

export const WithError: StoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '2'],
    errorMessage: 'errorMessage',
    showViewModes: false,
    viewMode: 'swap',
  },
};
export const WithImagePreview: StoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '3'],
    imageName: 'idle',
    showViewModes: false,
    viewMode: 'swap',
    images: { click: { actual: '1' }, idle: { actual: '2', error: 'error' } },
    imagesWithError: ['idle'],
  },
};

export const Full: StoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '4'],
    imageName: 'click',
    showViewModes: true,
    viewMode: 'swap',
    images: { click: { actual: '1', error: 'error' }, idle: { actual: '2', error: 'error' } },
    imagesWithError: ['idle', 'click'],
  },
};
