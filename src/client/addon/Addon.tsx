import React, { useState, Fragment, useContext, useCallback } from 'react';
import { withCreeveyTests } from './utils';
import { TestData } from '../../types';
import { IconButton, Icons, Loader, Separator } from '@storybook/components';
import { ResultsPage } from '../shared/components/ResultsPage';
import { CreeveyContext } from './CreeveyContext';
import { styled } from '@storybook/theming';
import { getTestPath } from '../shared/helpers';
import { CreeveyTabs } from './Tabs/Tabs';
import { ForwardIcon, NextIcon } from './Icons';
import { stringify } from 'qs';

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
  const { onStart, onStop, onImageApprove, onStartAllTests } = useContext(CreeveyContext);
  const [selectedTestId, setSelectedTestId] = useState(statuses[0].id);

  const handleRunInAllBrowsers = useCallback(() => {
    const testIds = statuses.map((x) => x.id);
    onStart(testIds);
  }, [statuses, onStart]);

  const result = statuses.find((x) => x.id === selectedTestId);

  const isRunning = result?.status === 'running';

  const tabs: { [key: string]: TestData[] } = statuses.reduce((buf: { [key: string]: TestData[] }, status) => {
    if (!buf[status.browser]) buf[status.browser] = [];
    buf[status.browser].push(status);
    return buf;
  }, {});

  return (
    <Fragment>
      <TabsWrapper>
        <CreeveyTabs
          selectedTestId={selectedTestId}
          onSelectTest={setSelectedTestId}
          tabs={tabs}
          tools={
            result && (
              <Fragment>
                <IconButton
                  href={`http://localhost:${__CREEVEY_CLIENT_PORT__ || __CREEVEY_SERVER_PORT__}/?${stringify({
                    testPath: getTestPath(result),
                  })}`}
                  target="_blank"
                  title="Show in Creevey UI"
                >
                  <Icons icon="sharealt" />
                </IconButton>
                <Separator />
                <IconButton
                  onClick={() => {
                    isRunning ? onStop() : onStartAllTests();
                  }}
                  title="Run all"
                >
                  {isRunning ? <Icons icon={'stop'} /> : <ForwardIcon />}
                </IconButton>
                <IconButton
                  onClick={() => {
                    isRunning ? onStop() : handleRunInAllBrowsers();
                  }}
                  title="Run all story tests"
                >
                  {isRunning ? <Icons icon={'stop'} /> : <NextIcon width={15} height={11} />}
                </IconButton>
                <IconButton
                  onClick={() => {
                    isRunning ? onStop() : onStart([result.id]);
                  }}
                  title="Run"
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

export const Panel = withCreeveyTests(PanelInternal);
