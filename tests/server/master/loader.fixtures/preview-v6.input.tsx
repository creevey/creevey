// @ts-nocheck
import React from 'react';
import { ThemeProvider } from 'styled-components';

const buttonTests = { async click() {} };

export const parameters = {
  creevey: {
    captureElement: '#root',
    tests: buttonTests,
  },
  backgrounds: {
    values: [
      { name: 'red', value: '#f00' },
      { name: 'green', value: '#0f0' },
    ],
  },
  options: {
    storySort: (a, b) =>
      a[1].kind === b[1].kind ? 0 : a[1].id.localeCompare(b[1].id, undefined, { numeric: true }),
  },
};

export const decorators = [
  (Story) => (
    <ThemeProvider theme="default">
      <Story />
    </ThemeProvider>
  ),
];