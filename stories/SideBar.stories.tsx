import { ComponentMeta, ComponentStoryObj } from '@storybook/react';
import { within } from '@storybook/testing-library'
import { SideBar } from '../src/client/web/CreeveyView/SideBar';
import { treeifyTests, checkSuite, getTestByPath } from '../src/client/shared/helpers';
import { noop, CreeveySuite, CreeveyStatus, isDefined, isTest } from '../src/types';

function openSuites(suite: CreeveySuite): CreeveySuite {
  suite.opened = true;
  Object.values(suite.children)
    .filter(isDefined)
    .forEach((suite) => isTest(suite) || openSuites(suite));

  return suite;
}

const simpleTests: () => CreeveyStatus['tests'] = () => ({
  1: { id: '1', browser: 'empty', storyPath: ['root', 'simple'], storyId: '', skip: false },
  2: {
    id: '2',
    browser: 'hasResult',
    storyPath: ['root', 'simple'],
    storyId: '',
    skip: false,
    results: [{ status: 'success' }],
  },
  3: { id: '3', browser: 'skipped', storyPath: ['root', 'simple'], storyId: '', skip: true },
  4: { id: '4', browser: 'empty', storyPath: ['root', 'skipped'], storyId: '', skip: true },
  5: {
    id: '5',
    browser: 'Storybook’s Component Story Format (CSF) is the recommended way to write stories',
    storyPath: ['root', 'simple'],
    storyId: '',
    skip: false,
    results: [{ status: 'success' }],
  },
});
const statusTests: () => CreeveyStatus['tests'] = () => ({
  5: { id: '5', browser: 'success', storyPath: ['root', 'success'], storyId: '', skip: false, status: 'success' },
  6: { id: '6', browser: 'empty', storyPath: ['root', 'success'], storyId: '', skip: false },

  7: { id: '7', browser: 'failed', storyPath: ['root', 'failed'], storyId: '', skip: false, status: 'failed' },
  8: { id: '8', browser: 'success', storyPath: ['root', 'failed'], storyId: '', skip: false, status: 'success' },

  9: { id: '9', browser: 'pending', storyPath: ['root', 'pending'], storyId: '', skip: false, status: 'pending' },
  10: { id: '10', browser: 'failed', storyPath: ['root', 'pending'], storyId: '', skip: false, status: 'failed' },

  11: {
    id: '11',
    browser: 'running',
    storyPath: ['root', 'running with very long name'],
    storyId: '',
    skip: false,
    status: 'running',
  },
  12: { id: '12', browser: 'pending', storyPath: ['root', 'running'], storyId: '', skip: false, status: 'pending' },
});

export default {
  title: 'SideBar',
  component: SideBar,
  args: {
    filter: { status: null, subStrings: [] },
    onOpenTest: noop,
    setFilter: noop,
  },
} as ComponentMeta<typeof SideBar>;

export const SimpleSideBar: ComponentStoryObj<typeof SideBar> = {
  args: (() => {
    const rootSuite = openSuites(treeifyTests(simpleTests()));
    const testPath = ['root', 'simple', 'hasResult'];

    checkSuite(rootSuite, testPath, false);

    return {
      rootSuite,
      openedTest: getTestByPath(rootSuite, testPath),
    };
  })(),
  async play({ canvasElement }) {
    const rootSuite = await within(canvasElement).findByTestId('root')
    rootSuite.classList.add('hover')
  }
};

export const StatusSideBar: ComponentStoryObj<typeof SideBar> = {
  args: {
    rootSuite: openSuites(treeifyTests(statusTests())),
    openedTest: null,
  }
}
