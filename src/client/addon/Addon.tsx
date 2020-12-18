import React, { useState, Fragment, useCallback, useContext } from 'react';
import { withCreeveyTests } from './utils';
import { TestData, TestStatus } from '../../types';
import { IconButton, Icons, Loader, Placeholder, Separator, Tabs } from '@storybook/components';
import { ResultsPage } from '../shared/components/ResultsPage';
import { CreeveyContext } from './CreeveyContext';
import { styled } from '@storybook/theming';
import { Tooltip } from './Tooltip';
import { getTestPath } from '../shared/helpers';

interface PanelProps {
  statuses: TestData[];
}

const Wrapper = styled.div<{ isRunning: boolean }>(({ isRunning }) => ({
  opacity: isRunning ? 0.5 : 1,
  height: 'calc(100% - 40px)',
}));

const TabsWrapper = styled.div({
  '&&': {
    position: 'sticky',
    height: 'initial',
    top: 0,
    zIndex: 2,
  },
});

const PanelInternal = ({ statuses }: PanelProps): JSX.Element => {
  const { onStart, onStop, onImageApprove } = useContext(CreeveyContext);
  const [selectedItem, setSelectedItem] = useState(0);
  const browsers = statuses.map((x) => x.browser);

  const handleBrowserChange = useCallback((id) => setSelectedItem(Number(id)), []);
  const result = statuses[selectedItem];
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
              <Tooltip testPath={getTestPath(result)} />
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
            height={'100%'}
            key={`${result.id}_${result.results?.length ?? 0}`} // TODO
            id={result.id}
            path={getTestPath(result)} // TODO Memo?
            results={result.results}
            approved={result.approved}
            onImageApprove={onImageApprove}
          />
        </Wrapper>
      ) : null}
    </Fragment>
  );
};

export function getEmojiByTestStatus(status: TestStatus | undefined, skip: string | boolean = false): string {
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
