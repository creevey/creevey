import React from 'react';
import { styled } from '@storybook/theming';
import { Meta, StoryObj } from '@storybook/react';
import { SideBarHeader } from '../src/client/web/CreeveyView/SideBar/SideBarHeader.js';
import { noop } from '../src/types.js';

const HeaderContainer = styled.div({ width: 300 });

const Kind: Meta<typeof SideBarHeader> = {
  title: 'SideBarHeader',
  component: SideBarHeader,
  args: {
    filter: { status: null, subStrings: [] },
    onFilterChange: noop,
    onStart: noop,
    onStop: noop,
  },
  decorators: [(Story) => <HeaderContainer>{<Story />}</HeaderContainer>],
};

export default Kind;

export const HeaderStopped: StoryObj<typeof SideBarHeader> = {
  args: {
    testsStatus: { pendingCount: 0, successCount: 1, failedCount: 2, skippedCount: 3 },
  },
};

export const HeaderRunning: StoryObj<typeof SideBarHeader> = {
  args: {
    testsStatus: { pendingCount: 1, successCount: 2, failedCount: 3, skippedCount: 4 },
  },
  parameters: { context: { isRunning: true } },
};

export const HeaderDisabled: StoryObj<typeof SideBarHeader> = {
  args: {
    testsStatus: { pendingCount: 0, successCount: 1, failedCount: 2, skippedCount: 3 },
    canStart: false,
  },
};
