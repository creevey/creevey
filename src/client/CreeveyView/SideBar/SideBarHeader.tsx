import React, { useContext, useState } from 'react';
import { css } from '@emotion/core';
import Spinner from '@skbkontur/react-ui/Spinner';
import Button from '@skbkontur/react-ui/Button';
import Input from '@skbkontur/react-ui/Input';
import SearchIcon from '@skbkontur/react-icons/Search';
import { CreeveyContex } from '../../CreeveyContext';
import { TestsStatus, TestsStatusProps } from './TestsStatus';
import { TestStatus } from '../../../types';
import { CreeveyViewFilter } from '../../../client/helpers';

interface SideBarHeaderProps {
  testsStatus: TestsStatusProps;
  onStart: () => void;
  onStop: () => void;
  onFilterChange: (value: CreeveyViewFilter) => void;
}

const parceStringForFilter = (value: string): CreeveyViewFilter => {
  let status: TestStatus | null = null;
  const subStrings: string[] = [];
  const tokens = value
    .split(' ')
    .filter(Boolean)
    .map(word => word.toLowerCase());

  tokens.forEach(word => {
    const [, matchedStatus] = /^status:(failed|success|pending|running|null)$/i.exec(word) || [];
    if (matchedStatus) return (status = matchedStatus as TestStatus);
    subStrings.push(word);
  });

  return { status, subStrings };
};

export function SideBarHeader({ testsStatus, onStop, onStart, onFilterChange }: SideBarHeaderProps): JSX.Element {
  const { isRunning } = useContext(CreeveyContex);
  const [filterInput, setFilterInput] = useState('');

  const handleClickFilterChange = (value: string): void => {
    const currentValue = parceStringForFilter(value);
    const oldValue = parceStringForFilter(filterInput);

    if (currentValue.status === oldValue.status) {
      onFilterChange({ status: null, subStrings: oldValue.subStrings });
      setFilterInput(oldValue.subStrings.join(' '));
    } else {
      onFilterChange({ status: currentValue.status, subStrings: oldValue.subStrings });
      setFilterInput(oldValue.subStrings.join(' ') + ' status:' + currentValue.status);
    }
  };

  const handleInputFilterChange = (_: React.ChangeEvent | null, value: string): void => {
    const currentValue = parceStringForFilter(value);

    onFilterChange({ status: currentValue.status, subStrings: currentValue.subStrings });
    setFilterInput(value);
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
          <TestsStatus {...testsStatus} onClick={handleClickFilterChange} />
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
          onChange={handleInputFilterChange}
          value={filterInput}
        />
      </div>
    </div>
  );
}
