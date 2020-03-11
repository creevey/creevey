import React, { useContext, useState } from 'react';
import { css } from '@emotion/core';
import { Button, Spinner, Input } from '@skbkontur/react-ui';
import SearchIcon from '@skbkontur/react-icons/Search';
import { CreeveyContext } from '../../CreeveyContext';
import { TestsStatus, TestsStatusProps } from './TestsStatus';
import { TestStatus } from '../../../types';
import { CreeveyViewFilter } from '../../../client/helpers';

interface SideBarHeaderProps {
  testsStatus: Omit<TestsStatusProps, 'onClickByStatus'>;
  onStart: () => void;
  onStop: () => void;
  filter: CreeveyViewFilter;
  onFilterChange: (value: CreeveyViewFilter) => void;
}

const parseStringForFilter = (value: string): CreeveyViewFilter => {
  let status: TestStatus | null = null;
  const subStrings: string[] = [];
  const tokens = value
    .split(' ')
    .filter(Boolean)
    .map(word => word.toLowerCase());

  tokens.forEach(word => {
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
    <div
      css={css`
        padding: 24px 32px 8px;
        background: #fff;
        height: 150px;
        z-index: 3;
        position: sticky;
        top: 0;
      `}
    >
      <div
        css={css`
          display: flex;
        `}
      >
        <div>
          <h2
            css={css`
              font-weight: normal;
              margin: 0;
            `}
          >
            colin.creevey
          </h2>
          <TestsStatus {...testsStatus} onClickByStatus={handleClickByStatus} />
        </div>
        <div
          css={css`
            margin-top: 10px;
          `}
        >
          {isRunning ? (
            <Button use="default" arrow size="medium" width={100} onClick={onStop}>
              <Spinner type="mini" caption="" /> Running
            </Button>
          ) : (
            <Button use="primary" arrow size="medium" width={100} onClick={onStart}>
              Start
            </Button>
          )}
        </div>
      </div>
      <div
        css={css`
          margin-top: 36px;
          margin-bottom: 24px;
        `}
      >
        <Input
          width="100%"
          placeholder="search by status or substring"
          size="medium"
          rightIcon={<SearchIcon />}
          onValueChange={handleInputFilterChange}
          value={filterInput}
        />
      </div>
    </div>
  );
}
