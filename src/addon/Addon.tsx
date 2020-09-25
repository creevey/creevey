import React, { useState, Fragment, useCallback, useContext } from 'react';
import { withCreeveyTests } from './utils';
import { Test, isDefined, TestStatus } from '../types';
import { IconButton, Icons, Loader, Separator, Tabs } from '@storybook/components';
import { ResultsPage } from './ResultsPage';
import { CreeveyContext } from './CreeveyContext';
import { styled } from '@storybook/theming';

interface PanelProps {
  statuses: Test[];
}

const Wrapper = styled.div<{ isRunning: boolean }>(({ isRunning }) => ({
  opacity: isRunning ? 0.5 : 1,
  margin: '20px',
  position: 'absolute',
}));

const PanelInternal = ({ statuses }: PanelProps): JSX.Element => {
  const [selectedItem, setSelectedItem] = useState(0);
  const browsers = statuses
    .map((x) => x.path)
    .filter(isDefined)
    .map((x) => x[0]);

  const handleBrowserChange = useCallback((id) => setSelectedItem(Number(id)), []);
  const result = statuses[selectedItem];
  const { onStart, onStop } = useContext(CreeveyContext);
  const isRunning = result?.status === 'running';
  return (
    <Fragment>
      <Tabs
        selected={`${selectedItem}`}
        actions={{ onSelect: handleBrowserChange }}
        tools={
          <Fragment>
            <Separator />
            <IconButton
              onClick={() => {
                isRunning ? onStop() : onStart([result.id]);
              }}
            >
              <Icons icon={isRunning ? 'stop' : 'play'} />
            </IconButton>
          </Fragment>
        }
      >
        {browsers.map((x, i) => (
          <div key={x} id={`${i}`} title={`${x} ${getEmojiByTestStatus(statuses[i].status, statuses[i].skip)}`} />
        ))}
      </Tabs>
      {isRunning && <Loader size={64} />}
      {result?.results?.length ? (
        <Wrapper isRunning={isRunning}>
          <ResultsPage
            key={`${result.id}_${result.results?.length ?? 0}`}
            id={result.id}
            path={result.path}
            results={result.results}
            approved={result.approved}
          />
        </Wrapper>
      ) : null}
    </Fragment>
  );
};

export function getEmojiByTestStatus(status: TestStatus | undefined, skip: string | boolean): string {
  switch (status) {
    case 'failed': {
      return '❌';
    }
    case 'success': {
      return '✔';
    }
    case 'running': {
      return '🟡';
    }
    case 'pending': {
      return '🕗';
    }
    default: {
      if (skip) return '⏸';
      return '';
    }
  }
}

export const Panel = withCreeveyTests(PanelInternal);
