import React, { useContext } from 'react';
import { css } from '@emotion/core';
import Spinner from '@skbkontur/react-ui/Spinner';
import Button from '@skbkontur/react-ui/Button';
import Input from '@skbkontur/react-ui/Input';
import SearchIcon from '@skbkontur/react-icons/Search';
import { CreeveyContex } from '../../CreeveyContext';
import { TestsStatus, TestsStatusProps } from './TestsStatus';

interface SideBarHeaderProps {
  testsStatus: TestsStatusProps;
  onStart: () => void;
  onStop: () => void;
  onFilterChange: (rawFilter: string) => void;
}

export function SideBarHeader({ testsStatus, onStop, onStart, onFilterChange }: SideBarHeaderProps): JSX.Element {
  const { isRunning } = useContext(CreeveyContex);
  const handleFilterChange = (_: React.ChangeEvent, value: string): void => onFilterChange(value);

  return (
    <>
      <div
        css={css`
          padding-right: 56px;
          display: flex;
          justify-content: space-between;
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
          <TestsStatus {...testsStatus} />
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
          onChange={handleFilterChange}
        />
      </div>
    </>
  );
}
