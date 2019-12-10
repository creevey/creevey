import React, { ReactNode } from 'react';
import { StoryFn } from '@storybook/addons';
import { css } from '@emotion/core';
import { CreeveyContex } from '../src/client/CreeveyContext';
import { SideBar } from '../src/client/CreeveyView/SideBar';
import { SideBarHeader } from '../src/client/CreeveyView/SideBar/SideBarHeader';
import { treeifyTests } from '../src/client/helpers';
import { noop, CreeveySuite, CreeveyStatus, isDefined, isTest } from '../src/types';

function openSuites(suite: CreeveySuite): void {
  suite.opened = true;
  Object.values(suite.children)
    .filter(isDefined)
    .forEach(suite => isTest(suite) || openSuites(suite));
}

const simpleTests: CreeveyStatus['tests'] = {
  1: { id: '1', path: ['empty', 'simple', 'root'], skip: false, retries: 0 },
  2: { id: '2', path: ['hasResult', 'simple', 'root'], skip: false, retries: 0, results: [{ status: 'success' }] },
  3: { id: '3', path: ['skipped', 'simple', 'root'], skip: true, retries: 0 },
  4: { id: '4', path: ['empty', 'skipped', 'root'], skip: true, retries: 0 },
};
const statusTests: CreeveyStatus['tests'] = {
  5: { id: '5', path: ['success', 'success', 'root'], skip: false, retries: 0, status: 'success' },
  6: { id: '6', path: ['empty', 'success', 'root'], skip: false, retries: 0 },

  7: { id: '7', path: ['failed', 'failed', 'root'], skip: false, retries: 0, status: 'failed' },
  8: { id: '8', path: ['success', 'failed', 'root'], skip: false, retries: 0, status: 'success' },

  9: { id: '9', path: ['pending', 'pending', 'root'], skip: false, retries: 0, status: 'pending' },
  10: { id: '10', path: ['failed', 'pending', 'root'], skip: false, retries: 0, status: 'failed' },

  11: { id: '11', path: ['running', 'running', 'root'], skip: false, retries: 0, status: 'running' },
  12: { id: '12', path: ['pending', 'running', 'root'], skip: false, retries: 0, status: 'pending' },
};
const simpleSuite: CreeveySuite = treeifyTests(simpleTests);
const statusSuite: CreeveySuite = treeifyTests(statusTests);

openSuites(simpleSuite);
openSuites(statusSuite);

const headerDecorator = (storyFn: StoryFn<ReactNode>) => (
  <div
    css={css`
      width: 440px;
    `}
  >
    {storyFn()}
  </div>
);

export default {
  title: 'SideBar',
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

export const HeaderStopped = () => (
  <SideBarHeader
    testsStatus={{ pendingCount: 0, successCount: 1, failedCount: 2, skippedCount: 3, removedCount: 4 }}
    onFilterChange={noop}
    onStart={noop}
    onStop={noop}
  />
);
HeaderStopped.story = { decorators: [headerDecorator] };

export const HeaderRunning = () => (
  <CreeveyContex.Provider
    value={{
      isRunning: true,
      onStart: noop,
      onStop: noop,
      onImageApprove: noop,
      onSuiteOpen: noop,
      onSuiteToggle: noop,
    }}
  >
    <SideBarHeader
      testsStatus={{ pendingCount: 1, successCount: 2, failedCount: 3, skippedCount: 4, removedCount: 5 }}
      onFilterChange={noop}
      onStart={noop}
      onStop={noop}
    />
  </CreeveyContex.Provider>
);
HeaderRunning.story = { decorators: [headerDecorator] };

export const SimpleSideBar = () => <SideBar rootSuite={simpleSuite} openedTest={null} onOpenTest={noop} />;
export const StatusSideBar = () => <SideBar rootSuite={statusSuite} openedTest={null} onOpenTest={noop} />;

// TODO Hover tests
