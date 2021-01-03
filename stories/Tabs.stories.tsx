import React, { Fragment } from 'react';
import { CreeveyTabs } from '../src/client/addon/Tabs/Tabs';
import { CreeveyStory, noop, TestData } from '../src/types';
// eslint-disable-next-line node/no-extraneous-import
import { action } from '@storybook/addon-actions';
import { IconButton, Icons, Separator } from '@storybook/components';
import { Story } from '@storybook/react';
export default {
  title: 'AddonTabs',
};

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
        chrome: [
          getTest({ id: '1', testName: 'click long long long long Name', status: 'failed' }),
          getTest({ id: '2', testName: 'another click' }),
          getTest({ id: '3', testName: 'click', status: undefined }),
        ],
        firefox: [getTest({ id: '4', browser: 'firefox', testName: 'click long long long long Name' })],
        firefox2: [getTest({ id: '5', browser: 'firefox2', testName: 'click' })],
        firefox3: [getTest({ id: '6', browser: 'firefox2' })],
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
      async clickTestName() {
        const tabs = await this.takeScreenshot();
        if (this.captureElement) {
          const chromeTab = await this.browser.findElement({ css: "button[type='button'][value~='chrome']" });
          await this.browser.actions().click(chromeTab).perform();
          const tooltip = await this.browser.findElement({ css: '.css-1tz551k' }).takeScreenshot();
          await this.expect({ tabs, tooltip }).to.matchImages();
        }
      },
    },
  },
};
