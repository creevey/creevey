import React, { ReactNode } from 'react';
import { StoryFn } from '@storybook/addons';
import { css } from '@emotion/core';
import { CreeveyContext } from '../src/client/shared/CreeveyContext';
import { SideBar } from '../src/client/web/CreeveyView/SideBar';
import { SideBarHeader } from '../src/client/web/CreeveyView/SideBar/SideBarHeader';
import { treeifyTests } from '../src/client/shared/helpers';
import { noop, CreeveySuite, CreeveyStatus, isDefined, isTest } from '../src/types';
import { ensure, ThemeProvider, themes } from '@storybook/theming';

function openSuites(suite: CreeveySuite): CreeveySuite {
  suite.opened = true;
  Object.values(suite.children)
    .filter(isDefined)
    .forEach((suite) => isTest(suite) || openSuites(suite));

  return suite;
}

const simpleTests: () => CreeveyStatus['tests'] = () => ({
  1: { id: '1', path: ['empty', 'simple', 'root'], skip: false },
  2: { id: '2', path: ['hasResult', 'simple', 'root'], skip: false, results: [{ status: 'success' }] },
  3: { id: '3', path: ['skipped', 'simple', 'root'], skip: true },
  4: { id: '4', path: ['empty', 'skipped', 'root'], skip: true },
  5: {
    id: '5',
    path: ['Storybook’s Component Story Format (CSF) is the recommended way to write stories', 'simple', 'root'],
    skip: false,
    results: [{ status: 'success' }],
  },
});
const statusTests: () => CreeveyStatus['tests'] = () => ({
  5: { id: '5', path: ['success', 'success', 'root'], skip: false, status: 'success' },
  6: { id: '6', path: ['empty', 'success', 'root'], skip: false },

  7: { id: '7', path: ['failed', 'failed', 'root'], skip: false, status: 'failed' },
  8: { id: '8', path: ['success', 'failed', 'root'], skip: false, status: 'success' },

  9: { id: '9', path: ['pending', 'pending', 'root'], skip: false, status: 'pending' },
  10: { id: '10', path: ['failed', 'pending', 'root'], skip: false, status: 'failed' },

  11: { id: '11', path: ['running', 'running', 'root'], skip: false, status: 'running' },
  12: { id: '12', path: ['pending', 'running', 'root'], skip: false, status: 'pending' },
});

const headerDecorator = (storyFn: StoryFn<ReactNode>): JSX.Element => (
  <div
    css={css`
      width: 300px;
    `}
  >
    {storyFn()}
  </div>
);

export default {
  title: 'SideBar',
  decorators: [
    (Story: React.ComponentClass): JSX.Element => (
      <ThemeProvider theme={ensure(themes.light)}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    creevey: {
      skip: {
        in: 'ie11',
        stories: /.*Side Bar$/,
        reason: 'Internet Explorer is not supported yet',
      },
    },
  },
};

export const HeaderStopped = (): JSX.Element => (
  <SideBarHeader
    testsStatus={{ pendingCount: 0, successCount: 1, failedCount: 2, skippedCount: 3 }}
    filter={{ status: null, subStrings: [] }}
    onFilterChange={noop}
    onStart={noop}
    onStop={noop}
  />
);
HeaderStopped.decorators = [headerDecorator];

export const HeaderRunning = (): JSX.Element => (
  <CreeveyContext.Provider
    value={{
      isRunning: true,
      onStart: noop,
      onStop: noop,
      onSuiteOpen: noop,
      onSuiteToggle: noop,
    }}
  >
    <SideBarHeader
      testsStatus={{ pendingCount: 1, successCount: 2, failedCount: 3, skippedCount: 4 }}
      filter={{ status: null, subStrings: [] }}
      onFilterChange={noop}
      onStart={noop}
      onStop={noop}
    />
  </CreeveyContext.Provider>
);
HeaderRunning.decorators = [headerDecorator];

export const HeaderDisabled = (): JSX.Element => (
  <SideBarHeader
    testsStatus={{ pendingCount: 0, successCount: 1, failedCount: 2, skippedCount: 3 }}
    filter={{ status: null, subStrings: [] }}
    onFilterChange={noop}
    onStart={noop}
    onStop={noop}
    canStart={false}
  />
);
HeaderDisabled.decorators = [headerDecorator];

export const SimpleSideBar = (): JSX.Element => (
  <SideBar rootSuite={openSuites(treeifyTests(simpleTests()))} openedTest={null} onOpenTest={noop} />
);


export const StatusSideBar = (): JSX.Element => (
  <SideBar rootSuite={openSuites(treeifyTests(statusTests()))} openedTest={null} onOpenTest={noop} />
);

// TODO Hover tests
