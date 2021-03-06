import React, { useState, useEffect, useCallback, useContext } from 'react';
import { CreeveySuite, isTest, noop } from '../../types';
import { CreeveyViewFilter, filterTests, flattenSuite, getSuiteByPath, getTestPath } from '../shared/helpers';
import { CreeveyContext } from './CreeveyContext';

export interface KeyboardEventsContextType {
  sidebarFocusedItem: string[];
  setSidebarFocusedItem: (path: string[]) => void;
}

export const KeyboardEventsContext = React.createContext<KeyboardEventsContextType>({
  sidebarFocusedItem: [],
  setSidebarFocusedItem: noop,
});

export const KeyboardEvents = ({
  children,
  rootSuite,
  filter,
}: {
  rootSuite: CreeveySuite;
  filter: CreeveyViewFilter;
  children: React.ReactChild;
}): JSX.Element => {
  const [sidebarFocusedItem, setSideBarFocusedItem] = useState<string[]>([]);

  const { onSuiteOpen, onSuiteToggle } = useContext(CreeveyContext);

  const suiteList = flattenSuite(filterTests(rootSuite, filter));

  const focusOnNode = useCallback((path: string[]): void => {
    setSideBarFocusedItem(path);
  }, []);

  const getFocusedItemIndex = useCallback((): number => {
    return suiteList.findIndex((x) => {
      const path = isTest(x.suite) ? getTestPath(x.suite) : x.suite.path;

      return (
        sidebarFocusedItem.length === path.length &&
        sidebarFocusedItem.every((focusedPath) => path.includes(focusedPath))
      );
    });
  }, [suiteList, sidebarFocusedItem]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // console.log(e.code, sidebarFocusedItem);
      if (e.code === 'Enter') {
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
      if (e.code === 'Space') {
        e.preventDefault();
        const focusedSuite = getSuiteByPath(rootSuite, sidebarFocusedItem);
        if (!focusedSuite) return;
        const path = isTest(focusedSuite) ? getTestPath(focusedSuite) : focusedSuite.path;
        onSuiteToggle(path, !focusedSuite.checked);
      }
      if (e.code === 'ArrowDown') {
        const currentIndex = sidebarFocusedItem.length === 0 ? -1 : getFocusedItemIndex();
        if (currentIndex === suiteList.length - 1) return;
        const nextSuite = suiteList[currentIndex + 1];
        const nextPath = isTest(nextSuite.suite) ? getTestPath(nextSuite.suite) : nextSuite.suite.path;
        focusOnNode(nextPath);
      }
      if (e.code === 'ArrowUp') {
        const currentIndex = sidebarFocusedItem.length === 0 ? 0 : getFocusedItemIndex();
        const nextSuite = currentIndex > 0 ? suiteList[currentIndex - 1].suite : rootSuite;
        const nextPath = isTest(nextSuite) ? getTestPath(nextSuite) : nextSuite.path;
        focusOnNode(nextPath);
      }

      if (e.code === 'ArrowRight') {
        if (sidebarFocusedItem.length === 0) return;
        const focusedSuite = getSuiteByPath(rootSuite, sidebarFocusedItem);

        if (!focusedSuite || isTest(focusedSuite)) return;
        onSuiteOpen(focusedSuite.path, true);
      }

      if (e.code === 'ArrowLeft') {
        if (sidebarFocusedItem.length === 0) return;
        const focusedSuite = getSuiteByPath(rootSuite, sidebarFocusedItem);
        if (!focusedSuite) return;
        if (!isTest(focusedSuite) && focusedSuite.opened) {
          onSuiteOpen(focusedSuite.path, false);
          return;
        }

        const path = isTest(focusedSuite) ? getTestPath(focusedSuite) : focusedSuite.path;
        focusOnNode(path.slice(0, -1));
      }
    },
    [focusOnNode, onSuiteOpen, onSuiteToggle, rootSuite, suiteList, getFocusedItemIndex, sidebarFocusedItem],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  return (
    <KeyboardEventsContext.Provider
      value={{ sidebarFocusedItem: sidebarFocusedItem, setSidebarFocusedItem: setSideBarFocusedItem }}
    >
      {children}
    </KeyboardEventsContext.Provider>
  );
};
