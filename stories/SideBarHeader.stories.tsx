import React from 'react';
import { SideBarHeader } from '../src/client/web/CreeveyView/SideBar/SideBarHeader.js';
import { noop } from '../src/types.js';
import { styled } from '@storybook/theming';
import { ComponentMeta, ComponentStoryObj } from '@storybook/react';

const HeaderContainer = styled.div({ width: 300 });

export default {
  title: 'SideBarHeader',
  component: SideBarHeader,
  args: {
    filter: { status: null, subStrings: [] },
    onFilterChange: noop,
    onStart: noop,
    onStop: noop,
  },
  decorators: [(Story) => <HeaderContainer>{<Story />}</HeaderContainer>],
} as ComponentMeta<typeof SideBarHeader>;

export const HeaderStopped: ComponentStoryObj<typeof SideBarHeader> = {
  args: {
    testsStatus: { pendingCount: 0, successCount: 1, failedCount: 2, skippedCount: 3 },
  },
};

export const HeaderRunning: ComponentStoryObj<typeof SideBarHeader> = {
  args: {
    testsStatus: { pendingCount: 1, successCount: 2, failedCount: 3, skippedCount: 4 },
  },
  parameters: { context: { isRunning: true } },
};

export const HeaderDisabled: ComponentStoryObj<typeof SideBarHeader> = {
  args: {
    testsStatus: { pendingCount: 0, successCount: 1, failedCount: 2, skippedCount: 3 },
    canStart: false,
  },
};
