import React, { JSX } from 'react';
import { Loader } from 'storybook/internal/components';
import { styled } from 'storybook/theming';
import { noop, TestData } from '../../../types.js';
import { ResultsPage } from '../../shared/components/ResultsPage.js';
import { getTestPath } from '../../shared/helpers.js';
import TestSelect from './TestSelect.js';

interface PanelProps {
  tests: TestData[];
  selectedTestId: string;
  onChangeTest: (testId: string) => void;
  onImageApprove: (id: string, retry: number, image: string) => void;
}

const Wrapper = styled.div<{ isRunning: boolean }>(({ isRunning }) => ({
  opacity: isRunning ? 0.5 : 1,
  height: '100%',
}));

const TestSelectContainer = styled.div(({ theme }) => ({
  padding: '8px',
  border: `1px solid ${theme.appBorderColor}`,
}));

export const Panel = ({ tests, selectedTestId, onChangeTest }: PanelProps): JSX.Element => {
  const result = tests.find((x) => x.id === selectedTestId);

  const isRunning = result?.status === 'running';

  return (
    <div>
      {tests.length > 1 && (
        <TestSelectContainer>
          <TestSelect tests={tests} selectedTestId={selectedTestId} onChangeTest={onChangeTest} />
        </TestSelectContainer>
      )}
      {isRunning && <Loader />}
      {result?.results?.length ? (
        <Wrapper isRunning={isRunning}>
          <ResultsPage
            height={'100%'}
            key={`${result.id}_${result.results.length}`} // TODO
            path={getTestPath(result)} // TODO Memo?
            results={result.results}
            approved={result.approved}
            // addon doesn't work, add only stubs
            retry={0}
            onRetryChange={noop}
            imageName=""
            onImageChange={noop}
          />
        </Wrapper>
      ) : null}
    </div>
  );
};
