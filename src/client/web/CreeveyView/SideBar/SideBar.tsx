import React, { createContext } from 'react';
import { transparentize } from 'polished';
import { ScrollArea } from '@storybook/components';
import { styled, Theme, withTheme } from '@storybook/theming';
import { SideBarHeader } from './SideBarHeader.js';
import { CreeveySuite, CreeveyTest, noop, isTest } from '../../../../types.js';
import {
  filterTests,
  CreeveyViewFilter,
  flattenSuite,
  countTestsStatus,
  getCheckedTests,
} from '../../../shared/helpers.js';
import { useCreeveyContext } from '../../CreeveyContext.js';
import { SuiteLink } from './SuiteLink.js';
import { TestLink } from './TestLink.js';
import { SideBarFooter } from './SideBarFooter.js';

export const SideBarContext = createContext<{ onOpenTest: (test: CreeveyTest) => void }>({
  onOpenTest: noop,
});

export interface SideBarProps {
  testId?: string;
  rootSuite: CreeveySuite;
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
  height: 'calc(100vh - 245px)',
  width: 300,
  flex: 'none',
  overflowY: 'auto',
  position: 'sticky',
  top: '0',
  left: '0',
});

const StyledScrollArea = styled(ScrollArea)({
  '& > div > div': {
    height: 'calc(100% - 8px)',
  },
});

const Shadow = withTheme(
  styled.div<{ theme: Theme; position: 'top' | 'bottom' }>(({ theme, position }) => ({
    [position]: '0px',
    position: 'sticky',
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
  paddingBottom: '8px',
  height: '100%',
});

const Divider = withTheme(
  styled.div<{ theme: Theme; position: 'top' | 'bottom' }>(({ theme, position }) => ({
    ...(position === 'top' ? { position: 'absolute' } : { position: 'relative', bottom: '8px', marginBottom: '-8px' }),
    height: '8px',
    width: '100%',
    zIndex: 4,
    background: theme.background.content,
  })),
);

export function SideBar({ rootSuite, testId, onOpenTest, filter, setFilter }: SideBarProps): JSX.Element {
  const { onStart, onStop } = useCreeveyContext();

  // TODO Maybe need to do flatten first?
  const suite = filterTests(rootSuite, filter);
  const testsStatus = countTestsStatus(rootSuite);
  const suiteList = flattenSuite(suite);
  const countCheckedTests = getCheckedTests(rootSuite).length;

  const handleStart = (): void => {
    onStart(suite);
  };

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
          <StyledScrollArea vertical>
            <Shadow position="top" />
            <TestsContainer>
              <Divider position="top" />
              {/* TODO Output message when nothing found */}
              <SelectAllContainer>
                <SuiteLink title="Select all" suite={rootSuite} data-testid="selectAll" />
              </SelectAllContainer>
              {suiteList.map(({ title, suite }) =>
                // TODO Update components without re-mount
                isTest(suite) ? (
                  <TestLink key={suite.id} title={title} opened={suite.id == testId} test={suite} />
                ) : (
                  <SuiteLink key={suite.path.join('/')} title={title} suite={suite} data-testid={title} />
                ),
              )}
            </TestsContainer>
            <Divider position="bottom" />
          </StyledScrollArea>
          <Shadow position="bottom" />
        </ScrollContainer>
        <SideBarFooter />
      </Container>
    </SideBarContext.Provider>
  );
}
