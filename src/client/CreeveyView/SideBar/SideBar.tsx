import React, { useState, createContext, useContext, useMemo } from 'react';
import { css } from '@emotion/core';
import ScrollContainer from '@skbkontur/react-ui/ScrollContainer';
import { ThemeProvider } from '@skbkontur/react-ui/ThemeProvider';
import { SideBarHeader } from './SideBarHeader';
import { CreeveySuite, TestStatus, CreeveyTest, noop, isTest } from '../../../types';
import { filterTests, CreeveyViewFilter, flattenSuite } from '../../helpers';
import { CreeveyContex } from '../../CreeveyContext';
import { SuiteLink } from './SuiteLink';
import { TestLink } from './TestLink';

const SUITE_LINK_THEME = {
  btnDisabledBg: '#fff',
  btnDefaultBgStart: '#fff',
  btnDefaultBgEnd: '#fff',
  btnDefaultBg: '#fff',
  btnDefaultHoverBgStart: '#e5e5e5',
  btnDefaultHoverBgEnd: '#e5e5e5',
  btnDefaultHoverBg: '#e5e5e5',
  btnDefaultActiveBgStart: '#e5e5e5',
  btnDefaultActiveBgEnd: '#e5e5e5',
  btnDefaultActiveBg: '#e5e5e5',
  btnDisabledShadow: 'none',
  btnDefaultShadow: 'none',
  btnDefaultHoverShadow: 'none',
  btnDefaultActiveShadow: 'none',
  btnSmallBorderRadius: '0px',
  btnWrapPadding: '0px',
  btnPaddingXSmall: '36px',
};

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

  const suite = useMemo(() => filterTests(rootSuite, filter), [rootSuite, filter]);
  const suiteList = flattenSuite(suite);

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
          flex: none;
        `}
      >
        <ScrollContainer>
          <div
            css={css`
              padding: 24px 32px 0px;
            `}
          >
            <SideBarHeader onFilterChange={handleFilterChange} onStart={handleStart} onStop={onStop} />
          </div>
          <ThemeProvider value={SUITE_LINK_THEME}>
            <div
              css={css`
                margin-bottom: 30px;
              `}
            >
              <SuiteLink title="Select all" suite={rootSuite} />
            </div>
            {suiteList.map(({ title, suite }) =>
              isTest(suite) ? (
                <TestLink key={title} title={title} test={suite} />
              ) : (
                <SuiteLink key={title} title={title} suite={suite} />
              ),
            )}
          </ThemeProvider>
        </ScrollContainer>
      </div>
    </SideBarContext.Provider>
  );
}
