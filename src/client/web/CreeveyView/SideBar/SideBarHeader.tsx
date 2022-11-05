import React, { useContext, useState } from 'react';
import { Button as NativeButton, Icons } from '@storybook/components';
import { styled, withTheme } from '@storybook/theming';
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
    padding: '24px 32px 8px',
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

const MarginContainer = styled.div<{ left?: string; right?: string; top?: string; bottom?: string }>(
  ({ left, right, top, bottom }) => ({
    marginLeft: left || 0,
    marginRight: right || 0,
    marginTop: top || 0,
    marginBottom: bottom || 0,
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
    const [, matchedStatus] = /^status:(failed|success|pending)$/i.exec(word) || [];
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
  const { isReport, isRunning } = useContext(CreeveyContext);
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
          <TestsStatus {...testsStatus} onClickByStatus={handleClickByStatus} />
        </div>
        {isReport ? null : (
          <MarginContainer top="10px">
            {isRunning ? (
              <Button outline secondary onClick={onStop}>
                <Icons icon="stop" />
              </Button>
            ) : (
              <Button outline secondary onClick={onStart} disabled={!canStart}>
                <Icons icon="play" />
              </Button>
            )}
          </MarginContainer>
        )}
      </Container>
      <MarginContainer top="24px" bottom="24px">
        <Search onChange={handleInputFilterChange} value={filterInput} />
      </MarginContainer>
    </Sticky>
  );
}
