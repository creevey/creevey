import React, { createContext, useContext } from 'react';
import { SideBarHeader } from './SideBarHeader.js';
import { CreeveySuite, CreeveyTest, noop, isTest } from '../../../../types.js';
import {
  filterTests,
  CreeveyViewFilter,
  flattenSuite,
  countTestsStatus,
  getCheckedTests,
} from '../../../shared/helpers.js';
import { CreeveyContext } from '../../CreeveyContext.js';
import { SuiteLink } from './SuiteLink.js';
import { TestLink } from './TestLink.js';
import { styled, withTheme } from '@storybook/theming';
import { transparentize } from 'polished';
import { ScrollArea } from '@storybook/components';

export const SideBarContext = createContext<{ onOpenTest: (test: CreeveyTest) => void }>({
  onOpenTest: noop,
});

export interface SideBarProps {
  rootSuite: CreeveySuite;
  openedTest: CreeveyTest | null;
  onOpenTest: (test: CreeveyTest) => void;
  filter: CreeveyViewFilter;
  setFilter: (filter: CreeveyViewFilter) => void;
}

const Container = withTheme(
  styled.div(({ theme }) => ({
    width: '300px',
    boxShadow: `0 0 5px  ${transparentize(0.8, theme.color.defaultText)}`,
    zIndex: 1000,
    background: theme.background.content,
  })),
);

const ScrollContainer = styled.div({
  height: 'calc(100vh - 165px)',
  width: 300,
  flex: 'none',
  overflowY: 'auto',
  position: 'sticky',
  top: '0',
  left: '0',
});

const Shadow = withTheme(
  styled.div(({ theme }) => ({
    position: 'sticky',
    top: '0px',
    boxShadow: `0 0 5px 2.5px ${transparentize(0.8, theme.color.defaultText)}`,
    zIndex: 3,
  })),
);

const SelectAllContainer = styled.div({
  marginBottom: '30px',
  paddingTop: '9px',
});

const TestsContainer = styled.div({
  position: 'relative',
  paddingBottom: '40px',
});

const Divider = withTheme(
  styled.div(({ theme }) => ({
    position: 'absolute',
    height: '8px',
    width: '100%',
    zIndex: 3,
    background: theme.background.content,
  })),
);

export function SideBar({ rootSuite, openedTest, onOpenTest, filter, setFilter }: SideBarProps): JSX.Element {
  const { onStart, onStop } = useContext(CreeveyContext);

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
        <ScrollContainer>
          <ScrollArea vertical>
            <Shadow />
            <TestsContainer>
              <Divider />
              {/* TODO Output message when nothing found */}
              <SelectAllContainer>
                <SuiteLink title="Select all" suite={rootSuite} data-testid="selectAll" />
              </SelectAllContainer>
              {suiteList.map(({ title, suite }) =>
                // TODO Update components without re-mount
                isTest(suite) ? (
                  <TestLink key={suite.id} title={title} opened={suite.id == openedTest?.id} test={suite} />
                ) : (
                  <SuiteLink key={suite.path.join('/')} title={title} suite={suite} data-testid={title} />
                ),
              )}
            </TestsContainer>
          </ScrollArea>
        </ScrollContainer>
      </Container>
    </SideBarContext.Provider>
  );
}
