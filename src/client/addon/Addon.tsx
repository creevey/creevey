import React, { useState, Fragment, useContext } from 'react';
import { withCreeveyTests } from './utils';
import { TestData } from '../../types';
import { Loader } from '@storybook/components';
import { ResultsPage } from '../shared/components/ResultsPage';
import { CreeveyContext } from './CreeveyContext';
import { styled } from '@storybook/theming';
import { getTestPath } from '../shared/helpers';
import { CreeveyTabs } from './Tabs/Tabs';
import { Tools } from './Tabs/Tools';

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
  const { onImageApprove } = useContext(CreeveyContext);
  const [selectedTestId, setSelectedTestId] = useState(statuses[0].id);

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
          tools={result && <Tools test={result} />}
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
