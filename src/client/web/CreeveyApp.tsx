import React, { useEffect, useState } from 'react';
import { useImmer } from 'use-immer';
import { CreeveyUpdate, CreeveySuite, isDefined, CreeveyTest } from '../../types';
import { CreeveyClientApi } from '../shared/creeveyClientApi';
import {
  getCheckedTests,
  updateTestStatus,
  splitLastPathToken,
  checkSuite,
  openSuite,
  getTestByPath,
  removeTests,
  getTestsByStoryId,
} from '../shared/helpers';
import { CreeveyContext } from './CreeveyContext';
import { SideBar } from './CreeveyView/SideBar';
import { ResultsPage } from '../shared/components/ResultsPage';
import { ensure, styled, ThemeProvider, themes, withTheme } from '@storybook/theming';
import { isUseDarkTheme, setUseDarkTheme } from './themeUtils';
import { Toggle } from './CreeveyView/SideBar/Toggle';
import { getStoryIdAndBrowserFromSearch, setSearchParams } from '../shared/searchUtils';

export interface CreeveyAppProps {
  api?: CreeveyClientApi;
  initialState: {
    tests: CreeveySuite;
    isRunning: boolean;
  };
}

const FlexContainer = withTheme(
  styled.div(({ theme }) => ({
    height: '100vh',
    display: 'flex',
    background: theme.background.content,
    color: theme.color.defaultText,
  })),
);

const ToggleContainer = styled.div({
  zIndex: 1,
  position: 'absolute',
  right: 10,
  top: 10,
});

function getPathFromUrl(tests: CreeveySuite): string[] {
  const { storyId, browser } = getStoryIdAndBrowserFromSearch();
  if (!isDefined(storyId) || !isDefined(browser)) return [];
  const testsByStoryId = getTestsByStoryId(tests, storyId);
  const currentTest = testsByStoryId.find((test) => test.path.includes(browser));
  return isDefined(currentTest) ? currentTest.path : [];
}

export function CreeveyApp({ api, initialState }: CreeveyAppProps): JSX.Element {
  const [tests, updateTests] = useImmer(initialState.tests);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [openedTestPath, openTest] = useState<string[]>([]);
  const [isDarkTheme, setIsDarkTheme] = useState(isUseDarkTheme());

  const openedTest = getTestByPath(tests, openedTestPath);
  if (openedTestPath.length > 0 && !isDefined(openedTest)) openTest([]);

  useEffect(() => {
    const path = getPathFromUrl(tests);
    if (path.length) {
      const currentPath: string[] = [];
      path.slice(0, -1).forEach((token) => {
        currentPath.push(token);
        openSuite(tests, currentPath, true);
      });
      openSuite(tests, path.slice(0, -1), true);
      openTest(path);
    }
  }, [tests]);

  // TODO unsubscribe
  useEffect(
    () =>
      api?.onUpdate(({ isRunning, tests, removedTests = [] }: CreeveyUpdate) => {
        if (isDefined(isRunning)) setIsRunning(isRunning);
        if (isDefined(tests))
          updateTests((draft) => {
            Object.values(tests).forEach(
              (test) => test && updateTestStatus(draft, [...splitLastPathToken(test.path).reverse()], test),
            );
            removedTests.forEach((testPath) => removeTests(draft, splitLastPathToken(testPath).reverse()));
          });
      }),
    [api, updateTests],
  );

  const handleSuiteOpen = (path: string[], opened: boolean): void => {
    updateTests((draft) => {
      openSuite(draft, path, opened);
    });
  };
  const handleSuiteToggle = (path: string[], checked: boolean): void => {
    updateTests((draft) => {
      checkSuite(draft, path, checked);
    });
  };
  const handleImageApprove = (id: string, retry: number, image: string): void => api?.approve(id, retry, image);
  const handleStart = (tests: CreeveySuite): void => api?.start(getCheckedTests(tests).map((test) => test.id));
  const handleStop = (): void => api?.stop();
  const handleThemeChange = (isDark: boolean): void => {
    setIsDarkTheme(isDark);
    setUseDarkTheme(isDark);
  };

  const handleOpenTest = (test: CreeveyTest): void => {
    setSearchParams(test.storyId || '', test.path.slice(-1)[0]);
    openTest(test.path);
  };

  return (
    <CreeveyContext.Provider
      value={{
        isRunning,
        onStart: handleStart,
        onStop: handleStop,
        onSuiteOpen: handleSuiteOpen,
        onSuiteToggle: handleSuiteToggle,
      }}
    >
      <ThemeProvider theme={ensure(isDarkTheme ? themes.dark : themes.light)}>
        <FlexContainer>
          <SideBar rootSuite={tests} openedTest={openedTest} onOpenTest={handleOpenTest} />
          {openedTest && (
            <ResultsPage
              key={`${openedTest.id}_${openedTest.results?.length ?? 0}`}
              id={openedTest.id}
              path={[...openedTest.path].reverse()}
              results={openedTest.results}
              approved={openedTest.approved}
              showTitle
              onImageApprove={handleImageApprove}
            />
          )}
          <ToggleContainer>
            <Toggle value={isDarkTheme} onChange={handleThemeChange} />
          </ToggleContainer>
        </FlexContainer>
      </ThemeProvider>
    </CreeveyContext.Provider>
  );
}
