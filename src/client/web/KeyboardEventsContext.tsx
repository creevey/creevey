import React, { JSX, useEffect, useCallback, PropsWithChildren } from 'react';
import { CreeveySuite, isTest } from '../../types.js';
import { CreeveyViewFilter, filterTests, flattenSuite, getSuiteByPath, getTestPath } from '../shared/helpers.js';
import { useCreeveyContext } from './CreeveyContext.js';

export const KeyboardEvents = ({
  children,
  rootSuite,
  filter,
}: PropsWithChildren<{
  rootSuite: CreeveySuite;
  filter: CreeveyViewFilter;
}>): JSX.Element => {
  const { onSuiteOpen, onSuiteToggle, sidebarFocusedItem, setSidebarFocusedItem } = useCreeveyContext();

  const suiteList = flattenSuite(filterTests(rootSuite, filter));

  const getFocusedItemIndex = useCallback(
    (item: string[]): number => {
      return suiteList.findIndex((x) => {
        const path = isTest(x.suite) ? getTestPath(x.suite) : x.suite.path;

        return item.length === path.length && item.every((focusedPath) => path.includes(focusedPath));
      });
    },
    [suiteList],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (sidebarFocusedItem === null) return;

      switch (e.code) {
        case 'Enter': {
          if (sidebarFocusedItem.length === 0) return;

          const focusedSuite = getSuiteByPath(rootSuite, sidebarFocusedItem);
          if (!focusedSuite) return;
          if (!isTest(focusedSuite)) {
            e.preventDefault();
            onSuiteOpen(focusedSuite.path, !focusedSuite.opened);
          }
          if (isTest(focusedSuite) && focusedSuite.results?.length == 0) {
            e.preventDefault();
          }
          return;
        }
        case 'Space': {
          e.preventDefault();
          // TODO handle keys in one place
          if (e.altKey) return;
          const focusedSuite = getSuiteByPath(rootSuite, sidebarFocusedItem);
          if (!focusedSuite) return;
          const path = isTest(focusedSuite) ? getTestPath(focusedSuite) : focusedSuite.path;
          onSuiteToggle(path, !focusedSuite.checked);
          return;
        }
        case 'ArrowDown': {
          const currentIndex = sidebarFocusedItem.length === 0 ? -1 : getFocusedItemIndex(sidebarFocusedItem);
          if (currentIndex === suiteList.length - 1) return;
          const nextSuite = suiteList[currentIndex + 1];
          const nextPath = isTest(nextSuite.suite) ? getTestPath(nextSuite.suite) : nextSuite.suite.path;
          setSidebarFocusedItem(nextPath);
          return;
        }
        case 'ArrowUp': {
          const currentIndex = sidebarFocusedItem.length === 0 ? 0 : getFocusedItemIndex(sidebarFocusedItem);
          const nextSuite = currentIndex > 0 ? suiteList[currentIndex - 1].suite : rootSuite;
          const nextPath = isTest(nextSuite) ? getTestPath(nextSuite) : nextSuite.path;
          setSidebarFocusedItem(nextPath);
          return;
        }
        case 'ArrowRight': {
          if (sidebarFocusedItem.length === 0) return;
          const focusedSuite = getSuiteByPath(rootSuite, sidebarFocusedItem);

          if (!focusedSuite || isTest(focusedSuite)) return;
          onSuiteOpen(focusedSuite.path, true);
          return;
        }
        case 'ArrowLeft': {
          if (sidebarFocusedItem.length === 0) return;
          const focusedSuite = getSuiteByPath(rootSuite, sidebarFocusedItem);
          if (!focusedSuite) return;
          if (!isTest(focusedSuite) && focusedSuite.opened) {
            onSuiteOpen(focusedSuite.path, false);
            return;
          }

          const path = isTest(focusedSuite) ? getTestPath(focusedSuite) : focusedSuite.path;
          setSidebarFocusedItem(path.slice(0, -1));
          return;
        }
      }
    },
    [onSuiteOpen, onSuiteToggle, rootSuite, suiteList, getFocusedItemIndex, sidebarFocusedItem, setSidebarFocusedItem],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  return <>{children}</>;
};
