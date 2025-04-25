import React, { JSX } from 'react';
import { ThemeProvider, themes, ensure } from '@storybook/theming';
import { CreeveyContext } from '../src/client/web/CreeveyContext.js';
import { noop } from '../src/types.js';
import type { DecoratorFunction } from '@storybook/types';

export const decorators: DecoratorFunction[] = [
  (storyFn, context): JSX.Element => (
    <ThemeProvider theme={ensure(themes.light)}>
      <CreeveyContext.Provider
        value={{
          isReport: false,
          isRunning: false,
          isUpdateMode: false,
          onImageApprove: noop,
          onApproveAll: noop,
          onStart: noop,
          onStop: noop,
          onSuiteOpen: noop,
          onSuiteToggle: noop,
          sidebarFocusedItem: null,
          setSidebarFocusedItem: noop,
        }}
      >
        {storyFn(context) as React.ReactElement}
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
