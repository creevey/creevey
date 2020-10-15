import React, { useState, createContext, useContext } from 'react';
import { SideBarHeader } from './SideBarHeader';
import { CreeveySuite, CreeveyTest, noop, isTest } from '../../../../types';
import {
  filterTests,
  CreeveyViewFilter,
  flattenSuite,
  countTestsStatus,
  getCheckedTests,
} from '../../../shared/helpers';
import { CreeveyContext } from '../../../shared/CreeveyContext';
import { SuiteLink } from './SuiteLink';
import { TestLink } from './TestLink';
import { styled, withTheme } from '@storybook/theming';

export const SideBarContext = createContext<{ onOpenTest: (path: string[]) => void }>({
  onOpenTest: noop,
});

export interface SideBarProps {
  rootSuite: CreeveySuite;
  openedTest: CreeveyTest | null;
  onOpenTest: (path: string[]) => void;
}

const Container = withTheme(
  styled.div(({ theme }) => ({
    width: '300px',
    boxShadow: '0 0 5px #aaa',
    height: '100vh',
    flex: 'none',
    zIndex: 1000,
    overflowY: 'auto',
    position: 'sticky',
    top: '0',
    left: '0',
    background: theme.background.content,
  })),
);

const Shadow = styled.div({
  position: 'sticky',
  top: '160px',
  boxShadow: '0 0 5px 2.5px #aaa',
  zIndex: 3,
});

const SelectAllContainer = styled.div({
  marginBottom: '30px',
  paddingTop: '8px',
});

const TestsContainer = styled.div({
  position: 'relative',
  paddingBottom: '40px',
});

const Divider = styled.div({
  position: 'absolute',
  height: '8px',
  width: '100%',
  zIndex: 3,
  background: '#fff',
});

export function SideBar({ rootSuite, openedTest, onOpenTest }: SideBarProps): JSX.Element {
  const { onStart, onStop } = useContext(CreeveyContext);
  const [filter, setFilter] = useState<CreeveyViewFilter>({ status: null, subStrings: [] });

  // TODO Maybe need to do flatten first?
  const suite = filterTests(rootSuite, filter);
  const testsStatus = countTestsStatus(rootSuite);
  const suiteList = flattenSuite(suite);
  const countCheckedTests = getCheckedTests(rootSuite).length;

  const handleStart = (): void => onStart(suite);

  return (
    <SideBarContext.Provider value={{ onOpenTest }}>
      <Container>
        <SideBarHeader
          testsStatus={testsStatus}
          filter={filter}
          onFilterChange={setFilter}
          onStart={handleStart}
          onStop={onStop}
          canStart={countCheckedTests !== 0}
        />
        <Shadow />
        <TestsContainer>
          <Divider />
          {/* TODO Output message where nothing found */}
          <SelectAllContainer>
            <SuiteLink title="Select all" suite={rootSuite} />
          </SelectAllContainer>
          {suiteList.map(({ title, suite }) =>
            isTest(suite) ? (
              <TestLink key={suite.path.join('/')} title={title} opened={suite.id == openedTest?.id} test={suite} />
            ) : (
              <SuiteLink key={suite.path.join('/')} title={title} suite={suite} />
            ),
          )}
        </TestsContainer>
      </Container>
    </SideBarContext.Provider>
  );
}
