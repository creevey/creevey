import React, { useCallback, useEffect, useState } from 'react';
import { useImmer } from 'use-immer';
import { CreeveyUpdate, CreeveySuite, isDefined, CreeveyTest } from '../../types';
import { CreeveyClientApi } from '../shared/creeveyClientApi';
import {
  getCheckedTests,
  updateTestStatus,
  checkSuite,
  openSuite,
  getTestByPath,
  removeTests,
  getTestPath,
  useTheme,
  setSearchParams,
  getTestPathFromSearch,
  CreeveyViewFilter,
} from '../shared/helpers';
import { CreeveyContext } from './CreeveyContext';
import { KeyboardEvents } from './KeyboardEventsContext';
import { SideBar } from './CreeveyView/SideBar';
import { ResultsPage } from '../shared/components/ResultsPage';
import { ensure, styled, ThemeProvider, themes, withTheme } from '@storybook/theming';
import { Toggle } from './CreeveyView/SideBar/Toggle';

export interface CreeveyAppProps {
  api?: CreeveyClientApi;
  initialState: {
    tests: CreeveySuite;
    isRunning: boolean;
    isReport: boolean;
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

export function CreeveyApp({ api, initialState }: CreeveyAppProps): JSX.Element {
  const [tests, updateTests] = useImmer(initialState.tests);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [openedTestPath, openTest] = useState<string[]>([]);
  const [filter, setFilter] = useState<CreeveyViewFilter>({ status: null, subStrings: [] });
  const [theme, setTheme] = useTheme();

  const openedTest = getTestByPath(tests, openedTestPath);
  if (openedTestPath.length > 0 && !isDefined(openedTest)) openTest([]);

  const handleSuiteOpen = useCallback(
    (path: string[], opened: boolean): void => {
      updateTests((draft) => {
        openSuite(draft, path, opened);
      });
    },
    [updateTests],
  );
  const handleSuiteToggle = useCallback(
    (path: string[], checked: boolean): void => {
      updateTests((draft) => {
        checkSuite(draft, path, checked);
      });
    },
    [updateTests],
  );
  const handleImageApprove = useCallback(
    (id: string, retry: number, image: string): void => api?.approve(id, retry, image),
    [api],
  );
  const handleStart = useCallback(
    (tests: CreeveySuite): void => api?.start(getCheckedTests(tests).map((test) => test.id)),
    [api],
  );
  const handleStop = useCallback((): void => api?.stop(), [api]);
  const handleThemeChange = useCallback((isDark: boolean): void => setTheme(isDark ? 'dark' : 'light'), [setTheme]);
  const handleOpenTest = useCallback((test: CreeveyTest): void => {
    const testPath = getTestPath(test);
    setSearchParams(testPath);
    openTest(testPath);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', (event) => {
      updateTests((draft) => {
        const state = event.state as unknown;
        if (state && typeof state == 'object' && 'testPath' in state) {
          const { testPath } = state as { testPath?: string[] };
          if (Array.isArray(testPath)) {
            // TODO Add validations
            openSuite(draft, testPath, true);
            openTest(testPath);
          }
        }
      });
    });
    updateTests((draft) => {
      const testPath = getTestPathFromSearch();

      openSuite(draft, testPath, true);
      openTest(testPath);
    });
  }, [updateTests]);

  // TODO unsubscribe
  useEffect(
    () =>
      api?.onUpdate(({ isRunning, tests, removedTests = [] }: CreeveyUpdate) => {
        if (isDefined(isRunning)) setIsRunning(isRunning);
        if (isDefined(tests))
          updateTests((draft) => {
            Object.values(tests).forEach((test) => test && updateTestStatus(draft, getTestPath(test), test));
            removedTests.forEach((test) => removeTests(draft, getTestPath(test)));
          });
      }),
    [api, updateTests],
  );

  return (
    <CreeveyContext.Provider
      value={{
        isReport: initialState.isReport,
        isRunning,
        onStart: handleStart,
        onStop: handleStop,
        onSuiteOpen: handleSuiteOpen,
        onSuiteToggle: handleSuiteToggle,
      }}
    >
      <ThemeProvider theme={ensure(themes[theme])}>
        <KeyboardEvents rootSuite={tests} filter={filter}>
          <FlexContainer>
            <SideBar
              rootSuite={tests}
              openedTest={openedTest}
              onOpenTest={handleOpenTest}
              filter={filter}
              setFilter={setFilter}
            />
            {openedTest && (
              <ResultsPage
                key={`${openedTest.id}_${openedTest.results?.length ?? 0}`}
                id={openedTest.id}
                path={openedTestPath}
                results={openedTest.results}
                approved={openedTest.approved}
                showTitle
                onImageApprove={handleImageApprove}
              />
            )}
            <ToggleContainer>
              <Toggle value={theme == 'dark'} onChange={handleThemeChange} />
            </ToggleContainer>
          </FlexContainer>
        </KeyboardEvents>
      </ThemeProvider>
    </CreeveyContext.Provider>
  );
}
