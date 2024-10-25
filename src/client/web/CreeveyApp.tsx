import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useImmer } from 'use-immer';
import { ensure, styled, ThemeProvider, themes, withTheme } from '@storybook/theming';
import { CreeveyUpdate, CreeveySuite, isDefined, CreeveyTest } from '../../types.js';
import { CreeveyClientApi } from '../shared/creeveyClientApi.js';
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
  getFailedTests,
} from '../shared/helpers.js';
import { CreeveyContext } from './CreeveyContext.js';
import { KeyboardEvents } from './KeyboardEventsContext.js';
import { SideBar } from './CreeveyView/SideBar/index.js';
import { ResultsPage } from '../shared/components/ResultsPage.js';
import { Toggle } from './CreeveyView/SideBar/Toggle.js';

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
  const failedTests = useMemo(() => getFailedTests(tests), [tests]);

  const [retry, setRetry] = useState(openedTest?.results?.length ?? 0);
  const result = openedTest?.results?.[retry - 1] ?? { images: {} };
  const [imageName, setImageName] = useState(Object.keys(result.images ?? {})[0] ?? '');
  const canApprove = useMemo(
    () =>
      Boolean(
        openedTest?.results?.[retry - 1]?.images &&
          openedTest.approved?.[imageName] != retry - 1 &&
          openedTest.results[retry - 1].status != 'success',
      ),
    [imageName, openedTest, retry],
  );

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

  const handleOpenTest = useCallback(
    (test: CreeveyTest): void => {
      const testPath = getTestPath(test);
      setSearchParams(testPath);
      updateTests((draft) => {
        openSuite(draft, testPath, true);
        openTest(testPath);
      });
    },
    [updateTests],
  );

  const handleGoToNextFailedTest = useCallback(() => {
    if (failedTests.length <= 1) return;
    const currentTest = failedTests.findIndex((t) => t.id === openedTest?.id);
    const nextFailedTest = failedTests[currentTest + 1] || failedTests[0];
    handleOpenTest(nextFailedTest);
  }, [failedTests, handleOpenTest, openedTest?.id]);

  const handleImageApproveNew = useCallback((): void => {
    const id = openedTest?.id;

    if (!id) return;
    api?.approve(id, retry, imageName);
  }, [api, imageName, openedTest?.id, retry]);

  const handleImageApproveAndGoNext = useCallback((): void => {
    handleImageApproveNew();
    handleGoToNextFailedTest();
  }, [handleImageApproveNew, handleGoToNextFailedTest]);

  const handleApproveAll = useCallback(() => {
    api?.approveAll();
  }, [api]);

  const handleStart = useCallback(
    (tests: CreeveySuite): void => api?.start(getCheckedTests(tests).map((test) => test.id)),
    [api],
  );
  const handleStop = useCallback((): void => api?.stop(), [api]);
  const handleThemeChange = useCallback(
    (isDark: boolean): void => {
      setTheme(isDark ? 'dark' : 'light');
    },
    [setTheme],
  );

  useEffect(() => {
    const retry = openedTest?.results?.length ?? 0;
    const result = openedTest?.results?.[retry - 1] ?? { images: {} };
    setImageName(Object.keys(result.images ?? {})[0] ?? '');
    setRetry(retry);
  }, [openedTest?.results]);

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
            Object.values(tests).forEach((test) => {
              if (test) updateTestStatus(draft, getTestPath(test), test);
            });
            removedTests.forEach((test) => {
              removeTests(draft, getTestPath(test));
            });
          });
      }),
    [api, updateTests],
  );

  return (
    <CreeveyContext.Provider
      value={{
        isReport: initialState.isReport,
        isRunning,
        onImageApprove: canApprove ? handleImageApproveAndGoNext : undefined,
        onApproveAll: handleApproveAll,
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
                path={openedTestPath}
                results={openedTest.results}
                approved={openedTest.approved}
                showTitle
                retry={retry}
                imageName={imageName}
                onImageChange={setImageName}
                onRetryChange={setRetry}
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
