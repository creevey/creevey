import React, { JSX, useEffect, useState } from 'react';
import { Placeholder } from 'storybook/internal/components';
import { TestData } from '../../../types.js';
import { Panel } from './Panel.js';
import { CreeveyController } from '../controller.js';

interface AddonProps {
  active?: boolean;
  browser: string;
  controller: CreeveyController;
}
export const Addon = ({ active, browser, controller }: AddonProps): JSX.Element | null => {
  const [tests, setTests] = useState<TestData[]>([]);

  const [selectedTestId, setSelectedTestId] = useState(controller.selectedTestId);

  useEffect(() => {
    if (active) {
      controller.setActiveBrowser(browser);
      const browserTests = controller.getTestsByStoryIdAndBrowser(controller.activeBrowser);
      setTests(browserTests);
    }
  }, [active, browser, controller]);

  useEffect(() => {
    const unsubscribe = controller.onChangeTest((testId) => {
      setSelectedTestId(testId);
      const status = controller.getTestsByStoryIdAndBrowser(controller.activeBrowser);
      setTests(status);
    });
    return unsubscribe;
  }, [controller]);

  useEffect(() => {
    const unsubscribe = controller.onUpdateStatus(() => {
      setTests(controller.getTestsByStoryIdAndBrowser(controller.activeBrowser));
    });
    return unsubscribe;
  }, [controller, browser]);

  return active ? (
    tests.length ? (
      <Panel
        tests={tests}
        selectedTestId={selectedTestId}
        onChangeTest={controller.setSelectedTestId}
        onImageApprove={controller.onImageApprove}
      />
    ) : (
      <Placeholder>No test results</Placeholder>
    )
  ) : null;
};
