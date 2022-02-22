import React from 'react';
import { ThemeProvider, themes, ensure } from '@storybook/theming';
import { CreeveyContext } from '../src/client/web/CreeveyContext';
import { noop } from '../src/types';
import { DecoratorFunction } from '@storybook/addons';

export const decorators: DecoratorFunction<JSX.Element>[] = [
  (Story, context): JSX.Element => (
    <ThemeProvider theme={ensure(themes.light)}>
      <CreeveyContext.Provider
        value={{
          isReport: false,
          isRunning: false,
          onStart: noop,
          onStop: noop,
          onSuiteOpen: noop,
          onSuiteToggle: noop,
          ...context.parameters?.context
        }}
      >
        <Story />
      </CreeveyContext.Provider>
    </ThemeProvider>
  ),
];

export const parameters = {
  creevey: {
    skip: {
      'Unsupported IE11 Stories': {
        in: 'ie11',
        kinds: ['Docs/ImagesViews', 'ImagesViews', 'BlendView', 'SideBySideView', 'SlideView', 'SwapView'],
      },
    },
  },
};
