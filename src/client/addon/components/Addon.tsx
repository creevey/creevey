import { Placeholder } from '@storybook/components';
import React, { useEffect, useState } from 'react';
import { TestData } from '../../../types';
import { Panel } from './Panel';
import { CreeveyManager } from '../Manager';

interface AddonProps {
  active?: boolean;
  browser: string;
  manager: CreeveyManager;
}
export const Addon = ({ active, browser, manager }: AddonProps): JSX.Element | null => {
  const [tests, setTests] = useState<TestData[]>([]);

  const [selectedTestId, setSelectedTestId] = useState(manager.selectedTestId);

  useEffect(() => {
    if (active) {
      manager.setActiveBrowser(browser);
      const browserTests = manager.getTestsByStoryIdAndBrowser(manager.activeBrowser);
      setTests(browserTests);
    }
  }, [active, browser, manager]);

  useEffect(() => {
    const unsubscribe = manager.onChangeTest((testId) => {
      setSelectedTestId(testId);
      const status = manager.getTestsByStoryIdAndBrowser(manager.activeBrowser);
      setTests(status);
    });
    return unsubscribe;
  }, [manager]);

  useEffect(() => {
    const unsubscribe = manager.onUpdateStatus(() => {
      setTests(manager.getTestsByStoryIdAndBrowser(manager.activeBrowser));
    });
    return unsubscribe;
  }, [manager, browser]);

  return active ? (
    tests.length ? (
      <Panel
        tests={tests}
        selectedTestId={selectedTestId}
        onChangeTest={manager.setSelectedTestId}
        onImageApprove={manager.onImageApprove}
      />
    ) : (
      <Placeholder>No test results</Placeholder>
    )
  ) : null;
};
