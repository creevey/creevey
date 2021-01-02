import React, { useState, useEffect, Fragment, useCallback, useContext } from 'react';
import { withCreeveyTests } from './utils';
import { TestData, TestStatus } from '../../types';
import { IconButton, Icons, Loader, Placeholder, Separator } from '@storybook/components';
import { ResultsPage } from '../shared/components/ResultsPage';
import { CreeveyContext } from './CreeveyContext';
import { styled } from '@storybook/theming';
import { Tooltip } from './Tooltip';
import { getTestPath } from '../shared/helpers';
import { CreeveyTabs } from './Tabs';

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
  const [selectedTest, changeSelectedTest] = useState<{ browser: string; testName?: string }>({ browser: '' });

  const handleSelectTest = useCallback((selectedTest: { browser: string; testName?: string }) => {
    changeSelectedTest(selectedTest);
  }, []);

  useEffect(() => {
    if (statuses.length && selectedTest.browser === '')
      changeSelectedTest({ browser: statuses[0].browser, testName: statuses[0].testName });
  }, [statuses, selectedTest]);

  const result = statuses.find(
    (x) =>
      x.browser === selectedTest.browser && (x.testName === selectedTest.testName || selectedTest.testName == null),
  );
  const isRunning = result?.status === 'running';

  const tabs: { [key: string]: TestData[] } = statuses.reduce((buf: { [key: string]: TestData[] }, status) => {
    if (!buf[status.browser]) buf[status.browser] = [];
    buf[status.browser].push(status);
    return buf;
  }, {});

  if (Object.keys(tabs).length === 0) {
    return (
      <Placeholder>{`Can't connect to Creevey server by 'http://${window.location.hostname}:${__CREEVEY_SERVER_PORT__}'. Please, make sure that you start it.`}</Placeholder>
    );
  }

  return (
    <Fragment>
      <TabsWrapper>
        <CreeveyTabs
          selectedTest={selectedTest}
          onSelectTest={handleSelectTest}
          tabs={tabs}
          tools={
            result && (
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
            )
          }
        />
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
