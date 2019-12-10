import React, { useState, createContext, useContext } from 'react';
import { css } from '@emotion/core';
import { ThemeProvider } from '@skbkontur/react-ui/ThemeProvider';
import { SideBarHeader } from './SideBarHeader';
import { CreeveySuite, TestStatus, CreeveyTest, noop, isTest } from '../../../types';
import { filterTests, CreeveyViewFilter, flattenSuite, countTestsStatus } from '../../helpers';
import { CreeveyContex } from '../../CreeveyContext';
import { SuiteLink } from './SuiteLink';
import { TestLink } from './TestLink';

const SUITE_LINK_THEME = {
  btnCheckedBg: '#1D85D0',
  btnDisabledBg: 'none',
  btnDefaultBgStart: 'none',
  btnDefaultBgEnd: 'none',
  btnDefaultBg: 'none',
  btnDefaultHoverBgStart: 'none',
  btnDefaultHoverBgEnd: 'none',
  btnDefaultHoverBg: 'none',
  btnDefaultActiveBgStart: 'none',
  btnDefaultActiveBgEnd: 'none',
  btnDefaultActiveBg: 'none',
  btnCheckedShadow: 'none',
  btnDisabledShadow: 'none',
  btnDefaultShadow: 'none',
  btnDefaultHoverShadow: 'none',
  btnDefaultActiveShadow: 'none',
  btnSmallBorderRadius: '0px',
  btnWrapPadding: '0px',
  btnPaddingXSmall: '36px',
  spinnerDimmedColor: '#fff',
};

export const SideBarContext = createContext<{ onOpenTest: (path: string[]) => void }>({
  onOpenTest: noop,
});

export interface SideBarProps {
  rootSuite: CreeveySuite;
  openedTest: CreeveyTest | null;
  onOpenTest: (path: string[]) => void;
}

export function SideBar({ rootSuite, openedTest, onOpenTest }: SideBarProps): JSX.Element {
  const { onStart, onStop } = useContext(CreeveyContex);
  const [filter, setFilter] = useState<CreeveyViewFilter>({ status: null, subStrings: [] });

  // TODO Maybe need to do flatten first?
  const suite = filterTests(rootSuite, filter);
  const testsStatus = countTestsStatus(rootSuite);
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
          z-index: 1000;
          overflow-y: auto;
          position: sticky;
          top: 0;
          left: 0;
          background: #fff;
        `}
      >
        <SideBarHeader
          testsStatus={testsStatus}
          onFilterChange={handleFilterChange}
          onStart={handleStart}
          onStop={onStop}
        />
        <div
          css={css`
            position: sticky;
            top: 180px;
            box-shadow: 0 0 5px 2.5px #aaa;
            z-index: 1;
          `}
        />
        <div
          css={css`
            position: relative;
          `}
        >
          <div
            css={css`
              position: absolute;
              height: 8px;
              width: 100%;
              z-index: 2;
              background: #fff;
            `}
          />
          {/* TODO Output message where nothing found */}
          <ThemeProvider value={SUITE_LINK_THEME}>
            <div
              css={css`
                margin-bottom: 30px;
                padding-top: 8px;
              `}
            >
              <SuiteLink title="Select all" suite={rootSuite} />
            </div>
            {suiteList.map(({ title, suite }) =>
              isTest(suite) ? (
                <TestLink key={suite.path.join('/')} title={title} opened={suite.id == openedTest?.id} test={suite} />
              ) : (
                <SuiteLink key={suite.path.join('/')} title={title} suite={suite} />
              ),
            )}
          </ThemeProvider>
        </div>
      </div>
    </SideBarContext.Provider>
  );
}
