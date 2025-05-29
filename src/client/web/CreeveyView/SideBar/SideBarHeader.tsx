import React, { JSX, useContext, useState } from 'react';
import { Button as NativeButton } from 'storybook/internal/components';
import { StopIcon, PlayIcon } from '@storybook/icons';
import { styled, withTheme } from 'storybook/theming';
import { CreeveyContext } from '../../CreeveyContext.js';
import { TestsStatus, TestsStatusProps } from './TestsStatus.js';
import { TestStatus } from '../../../../types.js';
import { CreeveyViewFilter } from '../../../shared/helpers.js';
import { Search } from './Search.js';

interface SideBarHeaderProps {
  testsStatus: Omit<TestsStatusProps, 'onClickByStatus'>;
  onStart: () => void;
  onStop: () => void;
  filter: CreeveyViewFilter;
  onFilterChange: (value: CreeveyViewFilter) => void;
  canStart?: boolean;
}

const Sticky = withTheme(
  styled.div(({ theme }) => ({
    padding: '24px 36px 8px',
    background: theme.background.content,
    height: '130px',
    zIndex: 5,
    position: 'sticky',
    top: '0',
  })),
);

const Container = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
});

const Header = styled.h2({
  fontWeight: 'normal',
  margin: 0,
  padding: '2px 6px',
});

const Button = withTheme(
  styled(NativeButton)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    transform: 'none',
    width: '60px',
    padding: '8px 12px',

    '& svg': {
      width: '24px',
      height: '24px',
      marginRight: 0,
    },

    '&:active svg path': {
      fill: theme.color.inverseText,
    },
  })),
);

const UpdateModeDescription = withTheme(
  styled.div(({ theme }) => ({
    fontSize: '0.8em',
    marginTop: '4px',
    padding: '2px 6px',
    color: theme.color.positive,
    backgroundColor: `${theme.color.positive}20`,
  })),
);

const MarginContainer = styled.div<{ left?: string; right?: string; top?: string; bottom?: string }>(
  ({ left, right, top, bottom }) => ({
    marginLeft: left ?? 0,
    marginRight: right ?? 0,
    marginTop: top ?? 0,
    marginBottom: bottom ?? 0,
    padding: '2px 6px',
  }),
);

const parseStringForFilter = (value: string): CreeveyViewFilter => {
  let status: TestStatus | null = null;
  const subStrings: string[] = [];
  const tokens = value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  tokens.forEach((word) => {
    const [, matchedStatus] = /^status:(failed|success|pending)$/i.exec(word) ?? [];
    if (matchedStatus) return (status = matchedStatus as TestStatus);
    subStrings.push(word);
  });

  return { status, subStrings };
};

export function SideBarHeader({
  testsStatus,
  onStop,
  onStart,
  filter,
  onFilterChange,
  canStart,
}: SideBarHeaderProps): JSX.Element {
  const { isReport, isRunning, isUpdateMode } = useContext(CreeveyContext);
  const [filterInput, setFilterInput] = useState('');

  const handleClickByStatus = (status: TestStatus): void => {
    if (status === filter.status) {
      setFilterInput(filter.subStrings.join(' '));
      onFilterChange({ status: null, subStrings: filter.subStrings });
    } else {
      setFilterInput(filter.subStrings.join(' ') + ' status:' + status);
      onFilterChange({ status, subStrings: filter.subStrings });
    }
  };

  const handleInputFilterChange = (value: string): void => {
    setFilterInput(value);
    onFilterChange(parseStringForFilter(value));
  };

  return (
    <Sticky>
      <Container>
        <div>
          <Header>colin.creevey</Header>
          {isUpdateMode && (
            <UpdateModeDescription>Review and approve screenshots from previous test runs</UpdateModeDescription>
          )}
          <TestsStatus {...testsStatus} onClickByStatus={handleClickByStatus} />
        </div>
        {isReport || isUpdateMode ? null : (
          <MarginContainer top="10px">
            {isRunning ? (
              <Button variant="outline" onClick={onStop}>
                <StopIcon />
              </Button>
            ) : (
              <Button variant="outline" onClick={onStart} disabled={!canStart}>
                <PlayIcon />
              </Button>
            )}
          </MarginContainer>
        )}
      </Container>
      <MarginContainer top="12px" bottom="12px">
        <Search onChange={handleInputFilterChange} value={filterInput} />
      </MarginContainer>
    </Sticky>
  );
}
