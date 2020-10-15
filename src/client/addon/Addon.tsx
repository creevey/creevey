import React, { useState, Fragment, useCallback, useContext } from 'react';
import { withCreeveyTests } from './utils';
import { Test, isDefined, TestStatus } from '../../types';
import { IconButton, Icons, Loader, Placeholder, Separator, Tabs } from '@storybook/components';
import { ResultsPage } from '../shared/components/ResultsPage';
import { CreeveyContext } from './CreeveyContext';
import { styled, withTheme, Theme } from '@storybook/theming';

interface PanelProps {
  statuses: Test[];
}

const Wrapper = withTheme(
  styled.div<{ isRunning: boolean; theme: Theme }>(({ isRunning, theme }) => ({
    opacity: isRunning ? 0.5 : 1,
    padding: '20px',
    paddingBottom: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    background: theme.background.content,
  })),
);

const TabsWrapper = styled.div({
  '&&': {
    position: 'static',
    height: 'initial',
  },
});

const PanelInternal = ({ statuses }: PanelProps): JSX.Element => {
  const [selectedItem, setSelectedItem] = useState(0);
  const browsers = statuses
    .map((x) => x.path)
    .filter(isDefined)
    .map((x) => x[0]);

  const handleBrowserChange = useCallback((id) => setSelectedItem(Number(id)), []);
  const result = statuses[selectedItem];
  const { onStart, onStop, onImageApprove } = useContext(CreeveyContext);
  const isRunning = result?.status === 'running';
  if (!browsers.length) {
    return (
      <Placeholder>{`Can't connect to Creevey server by 'http://${window.location.hostname}:${__CREEVEY_SERVER_PORT__}'. Please, make sure that you start it.`}</Placeholder>
    );
  }

  return (
    <Fragment>
      <TabsWrapper>
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
      </TabsWrapper>
      {isRunning && <Loader />}
      {result?.results?.length ? (
        <Wrapper isRunning={isRunning}>
          <ResultsPage
            key={`${result.id}_${result.results?.length ?? 0}`}
            id={result.id}
            path={result.path}
            results={result.results}
            approved={result.approved}
            onImageApprove={onImageApprove}
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
