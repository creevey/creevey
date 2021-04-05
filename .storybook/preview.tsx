import React from 'react';
import { ThemeProvider, themes, ensure } from '@storybook/theming';

export const decorators = [
  (Story: React.ComponentClass): JSX.Element => (
    <ThemeProvider theme={ensure(themes.light)}>
      <Story />
    </ThemeProvider>
  ),
];

export const parameters = {
  creevey: {
    skip: {
      in: 'ie11',
      kinds: ['Docs/ImagesViews', 'ImagesViews', 'BlendView', 'SideBySideView', 'SlideView', 'SwapView'],
    },
  },
};
