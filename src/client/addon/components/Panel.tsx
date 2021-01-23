import React from 'react';
import { TestData } from '../../../types';
import { Loader } from '@storybook/components';
import { ResultsPage } from '../../shared/components/ResultsPage';
import { styled } from '@storybook/theming';
import { getTestPath } from '../../shared/helpers';
import TestSelect from './TestSelect';
interface PanelProps {
  statuses: TestData[];
  selectedTestId: string;
  onChangeTest: (testId: string) => void;
  onImageApprove: (id: string, retry: number, image: string) => void;
}

const Wrapper = styled.div<{ isRunning: boolean }>(({ isRunning }) => ({
  opacity: isRunning ? 0.5 : 1,
  height: 'calc(100% - 40px)',
}));

const TestSelectContainer = styled.div(({ theme }) => ({
  padding: '8px',
  border: `1px solid ${theme.appBorderColor}`,
}));

export const Panel = ({ statuses, selectedTestId, onChangeTest, onImageApprove }: PanelProps): JSX.Element => {
  const result = statuses.find((x) => x.id === selectedTestId);

  const isRunning = result?.status === 'running';

  return (
    <div>
      {statuses.length > 1 && (
        <TestSelectContainer>
          <TestSelect tests={statuses} selectedTestId={selectedTestId} onChangeTest={onChangeTest} />
        </TestSelectContainer>
      )}
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
    </div>
  );
};
