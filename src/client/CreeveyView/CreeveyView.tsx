import React, { useState } from 'react';
import { css } from '@emotion/core';
import { ResultsPage } from './ResultsPage';
import { CreeveySuite, CreeveyTest } from '../../types';
import { SideBar } from './SideBar';

interface CreeveyViewProps {
  rootSuite: CreeveySuite;
}

export function CreeveyView({ rootSuite }: CreeveyViewProps) {
  const [openedTest, openTest] = useState<CreeveyTest | null>(null);

  return (
    <div
      css={css`
        display: flex;
        flex-flow: column no-wrap;
      `}
    >
      <SideBar rootSuite={rootSuite} onOpenTest={openTest} />
      {openedTest && (
        <ResultsPage
          id={openedTest.id}
          path={openedTest.path}
          results={openedTest.results}
          approved={openedTest.approved}
        />
      )}
    </div>
  );
}
