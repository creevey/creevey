import React from 'react';
import { ThemeProvider, themes, ensure } from '@storybook/theming';
export const parameters = { creevey: { captureElement: '#root' } };

export const decorators = [
  (Story: React.ComponentClass): JSX.Element => (
    <ThemeProvider theme={ensure(themes.light)}>
      <Story />
    </ThemeProvider>
  ),
];
