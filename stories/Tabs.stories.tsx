import React, { Fragment } from 'react';
import { CreeveyTabs } from '../src/client/addon/Tabs/Tabs';
import { CreeveyStory, noop, TestData } from '../src/types';
// eslint-disable-next-line node/no-extraneous-import
import { action } from '@storybook/addon-actions';
import { IconButton, Icons, Separator } from '@storybook/components';
import { Meta, Story } from '@storybook/react';
import { styled } from '@storybook/theming';

const TabsContainer = styled.div({
  height: '150px',
});

export default {
  title: 'AddonTabs',
  decorators: [(storyFn) => <TabsContainer id="addon-tabs">{storyFn()}</TabsContainer>],
} as Meta;

const onSelect = action('onSelect');

function getTest(test: Partial<TestData>): TestData {
  return {
    id: '1',
    browser: 'chrome',
    status: 'success',
    storyPath: ['root', 'simple'],
    storyId: '',
    skip: false,
    ...test,
  };
}

export const WithNamesAndBrowsers: Story & CreeveyStory = () => {
  return (
    <CreeveyTabs
      selectedTestId={'2'}
      tabs={{
        firefox: [getTest({ id: '3', browser: 'firefox' })],
        chrome: [
          getTest({ id: '1', testName: 'click long long long long Name', status: 'failed' }),
          getTest({ id: '2', testName: 'click', status: undefined }),
        ],
      }}
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
};

WithNamesAndBrowsers.parameters = {
  creevey: {
    tests: {
      async click() {
        const chromeTab = await this.browser.findElement({ css: "button[type='button'][value~='chrome']" });
        await this.browser.actions().click(chromeTab).perform();
        await this.expect(await this.takeScreenshot()).to.matchImage();
      },
    },
  },
};
