import React, { Fragment } from 'react';
import { CreeveyTabs } from '../src/client/addon/Tabs';
import { noop, TestData } from '../src/types';
// eslint-disable-next-line node/no-extraneous-import
import { action } from '@storybook/addon-actions';
import { IconButton, Icons, Separator } from '@storybook/components';
export default {
  title: 'AddonTabs',
};

const onSelect = action('onSelect');
const simpleTests: TestData[] = [
  { id: '1', browser: 'chrome', storyPath: ['root', 'simple'], storyId: '', skip: false },
  { id: '2', browser: 'firefox', storyPath: ['root', 'simple'], storyId: '', skip: false },
];

const withNameTests: () => TestData[] = () => [
  { id: '1', browser: 'chrome', testName: 'click', storyPath: ['root', 'simple'], storyId: '', skip: false },
  { id: '2', browser: 'chrome', testName: 'another click', storyPath: ['root', 'simple'], storyId: '', skip: false },
];

export const Browsers = (): JSX.Element => (
  <CreeveyTabs
    selectedTest={{ browser: 'chrome' }}
    tabs={{ chrome: [simpleTests[0]], firefox: [simpleTests[1]] }}
    onSelectTest={onSelect}
  />
);

export const TestNames = (): JSX.Element => (
  <CreeveyTabs
    selectedTest={{ browser: 'chrome', testName: 'click' }}
    tabs={{ chrome: withNameTests() }}
    onSelectTest={onSelect}
  />
);

export const WithTools = (): JSX.Element => (
  <CreeveyTabs
    selectedTest={{ browser: 'chrome', testName: 'click' }}
    tabs={{ chrome: withNameTests() }}
    onSelectTest={onSelect}
    tools={
      <Fragment>
        <Separator />
        <IconButton onClick={noop}>
          <Icons icon={'play'} />
        </IconButton>
      </Fragment>
    }
  />
);
