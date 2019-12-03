import React, { useRef, useContext, useEffect } from 'react';
import { css } from '@emotion/core';
import ArrowTriangleRightIcon from '@skbkontur/react-icons/ArrowTriangleRight';
import ArrowTriangleDownIcon from '@skbkontur/react-icons/ArrowTriangleDown';
import Checkbox from '@skbkontur/react-ui/Checkbox';
import Button from '@skbkontur/react-ui/Button';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveySuite, isTest } from '../../../types';
import { CreeveyContex } from '../../CreeveyContext';

export interface SuiteLinkProps {
  title: string;
  suite: CreeveySuite;
}

export function SuiteLink({ title, suite }: SuiteLinkProps): JSX.Element {
  const { onSuiteOpen, onSuiteToggle } = useContext(CreeveyContex);
  const checkboxRef = useRef<Checkbox>(null);
  useEffect(
    () => (suite.indeterminate ? checkboxRef.current?.setIndeterminate() : checkboxRef.current?.resetIndeterminate()),
    [suite.indeterminate],
  );

  const handleCheck = (_: React.ChangeEvent, value: boolean): void => onSuiteToggle(suite.path, value);
  const handleOpen = (): void => onSuiteOpen(suite.path, !suite.opened);

  return (
    <Button width="100%" align="left" onClick={handleOpen}>
      <TestStatusIcon status={suite.status} />
      <span
        css={css`
          padding-left: 16px;
        `}
      >
        <Checkbox
          ref={checkboxRef}
          checked={suite.skip ? false : suite.checked}
          disabled={Boolean(suite.skip)}
          onChange={handleCheck}
        />
      </span>
      <span
        css={css`
          padding-left: ${Math.max(16, (suite.path.length + 1) * 8)}px;
        `}
      >
        {isTest(suite) ||
          (Boolean(suite.path.length) && (
            <span
              css={css`
                padding-right: 8px;
                display: inline-block;
              `}
            >
              {suite.opened ? <ArrowTriangleDownIcon /> : <ArrowTriangleRightIcon />}
            </span>
          ))}
        {title}
      </span>
    </Button>
  );
}
