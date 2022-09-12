import { ComponentMeta, ComponentStoryObj } from '@storybook/react';
import { PageHeader } from '../src/client/shared/components/PageHeader/PageHeader.js';
import { noop } from '../src/types.js';

export default {
  title: 'PageHeader',
  component: PageHeader,
  args: {
    showTitle: true,
    onImageChange: noop,
    onViewModeChange: noop,
  },
} as ComponentMeta<typeof PageHeader>;

export const Simple: ComponentStoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '1'],
    showViewModes: true,
    viewMode: 'side-by-side',
  },
};

export const WithError: ComponentStoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '2'],
    errorMessage: 'errorMessage',
    showViewModes: false,
    viewMode: 'swap',
  },
};
export const WithImagePreview: ComponentStoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '3'],
    showViewModes: false,
    viewMode: 'swap',
    images: { click: { actual: '1' }, idle: { actual: '2', error: 'error' } },
    imagesWithError: ['idle'],
  },
};

export const Full: ComponentStoryObj<typeof PageHeader> = {
  args: {
    title: ['chrome', 'title', '4'],
    showViewModes: true,
    viewMode: 'swap',
    images: { click: { actual: '1', error: 'error' }, idle: { actual: '2', error: 'error' } },
    imagesWithError: ['idle', 'click'],
  },
};
