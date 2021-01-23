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
  const [status, setStatus] = useState<TestData[]>([]);

  const [selectedTestId, setSelectedTestId] = useState(manager.selectedTestId);

  useEffect(() => {
    if (active) {
      manager.setActiveBrowser(browser);
      const browserStatus = manager.getTestsByStoryIdAndBrowser();
      setStatus(browserStatus);
    }
  }, [active, browser, manager]);

  useEffect(() => {
    const unsubscribe = manager.onChangeTest((testId) => {
      setSelectedTestId(testId);
      const status = manager.getTestsByStoryIdAndBrowser();
      setStatus(status);
    });
    return unsubscribe;
  }, [manager]);

  useEffect(() => {
    const unsubscribe = manager.onUpdateStatus(() => {
      setStatus(manager.getTestsByStoryIdAndBrowser());
    });
    return unsubscribe;
  }, [manager, browser]);

  return active ? (
    status.length ? (
      <Panel
        statuses={status}
        selectedTestId={selectedTestId}
        onChangeTest={manager.setSelectedTestId}
        onImageApprove={manager.onImageApprove}
      />
    ) : (
      <Placeholder>No test results</Placeholder>
    )
  ) : null;
};
