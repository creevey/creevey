import React, { useState, createContext, useContext } from 'react';
import ScrollContainer from '@skbkontur/react-ui/ScrollContainer';
import { TestTree } from './TestTree';
import { SideBarHeader } from './SideBarHeader';
import { css } from '@emotion/core';
import { CreeveySuite, TestStatus, CreeveyTest, noop } from '../../../types';
import { filterTests, CreeveyViewFilter } from '../../helpers';
import { CreeveyContex } from '../../CreeveyContext';

export const SideBarContext = createContext<{ onOpenTest: (test: CreeveyTest) => void }>({
  onOpenTest: noop,
});

export interface SideBarProps {
  rootSuite: CreeveySuite;
  onOpenTest: (test: CreeveyTest) => void;
}

export function SideBar({ rootSuite, onOpenTest }: SideBarProps): JSX.Element {
  const { onStart, onStop } = useContext(CreeveyContex);
  const [filter, setFilter] = useState<CreeveyViewFilter>({ status: null, subStrings: [] });

  const suite = filterTests(rootSuite, filter);

  const handleStart = (): void => onStart(suite);
  const handleFilterChange = (rawFilter: string): void => {
    let status: TestStatus | null = null;
    const subStrings: string[] = [];
    const tokens = rawFilter
      .split(' ')
      .filter(Boolean)
      .map(word => word.toLowerCase());

    tokens.forEach(word => {
      const [, matchedStatus] = /^status:(failed|success)$/i.exec(word) || [];
      if (matchedStatus) return (status = matchedStatus as TestStatus);
      subStrings.push(word);
    });
    setFilter({ status, subStrings });
  };

  return (
    <SideBarContext.Provider value={{ onOpenTest }}>
      <div
        css={css`
          width: 440px;
          box-shadow: 0 0 5px #aaa;
          height: 100vh;
        `}
      >
        <ScrollContainer>
          <SideBarHeader onFilterChange={handleFilterChange} onStart={handleStart} onStop={onStop} />
          {Object.entries(suite.children).map(([title, testOrSuite]) => (
            <TestTree key={title} title={title} testOrSuite={testOrSuite} />
          ))}
        </ScrollContainer>
      </div>
    </SideBarContext.Provider>
  );
}
