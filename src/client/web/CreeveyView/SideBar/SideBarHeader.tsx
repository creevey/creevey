import React, { useContext, useState } from 'react';
import { Button as NativeButton, Loader } from '@storybook/components';
import { styled } from '@storybook/theming';
import { CreeveyContext } from '../../../shared/CreeveyContext';
import { TestsStatus, TestsStatusProps } from './TestsStatus';
import { TestStatus } from '../../../../types';
import { CreeveyViewFilter } from '../../../shared/helpers';
import { Search } from './Search';

interface SideBarHeaderProps {
  testsStatus: Omit<TestsStatusProps, 'onClickByStatus'>;
  onStart: () => void;
  onStop: () => void;
  filter: CreeveyViewFilter;
  onFilterChange: (value: CreeveyViewFilter) => void;
  canStart?: boolean;
}

const Sticky = styled.div({
  padding: '24px 32px 8px',
  background: '#fff',
  height: '130px',
  zIndex: 5,
  position: 'sticky',
  top: '0',
});

const Container = styled.div({
  display: 'flex',
});

const Header = styled.h2({
  fontWeight: 'normal',
  margin: 0,
});

const Button = styled(NativeButton)({
  width: '110px',
  display: 'flex',
  justifyContent: 'center',
});

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
  const { isRunning } = useContext(CreeveyContext);
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
        <MarginContainer top="10px">
          {isRunning ? (
            <Button outline secondary onClick={onStop}>
              <div style={{ position: 'relative', width: '10px', height: '10px' }}>
                <Loader size={16} />
              </div>
              <MarginContainer left="15px">Running</MarginContainer>
            </Button>
          ) : (
            <Button outline secondary onClick={onStart} disabled={!canStart}>
              Start
            </Button>
          )}
        </MarginContainer>
      </Container>
      <MarginContainer top="24px" bottom="24px">
        <Search onChange={handleInputFilterChange} value={filterInput} />
      </MarginContainer>
    </Sticky>
  );
}
