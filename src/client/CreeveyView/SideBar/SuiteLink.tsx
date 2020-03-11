import React, { useRef, useContext, useEffect } from 'react';
import { css } from '@emotion/core';
import { Button, Checkbox } from '@skbkontur/react-ui';
import ArrowTriangleRightIcon from '@skbkontur/react-icons/ArrowTriangleRight';
import ArrowTriangleDownIcon from '@skbkontur/react-icons/ArrowTriangleDown';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveySuite, isTest } from '../../../types';
import { CreeveyContext } from '../../CreeveyContext';

export interface SuiteLinkProps {
  title: string;
  suite: CreeveySuite;
}

export function SuiteLink({ title, suite }: SuiteLinkProps): JSX.Element {
  const { onSuiteOpen, onSuiteToggle } = useContext(CreeveyContext);
  const checkboxRef = useRef<Checkbox>(null);
  useEffect(
    () => (suite.indeterminate ? checkboxRef.current?.setIndeterminate() : checkboxRef.current?.resetIndeterminate()),
    [suite.indeterminate],
  );

  const isRootSuite = suite.path.length == 0;

  const handleCheck = (value: boolean): void => onSuiteToggle(suite.path, value);
  const handleOpen = (): void => void (isRootSuite || onSuiteOpen(suite.path, !suite.opened));

  return (
    <div
      css={css`
        position: relative;
        &:hover {
          background: #e5e5e5;
        }
      `}
    >
      <Button width="100%" align="left" onClick={handleOpen}>
        <TestStatusIcon status={suite.status} skip={suite.skip} />
        <span
          css={css`
            padding-left: ${Math.max(48, (suite.path.length + 5) * 8)}px;
            white-space: normal;
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
      <div
        css={css`
          position: absolute;
          left: 66px;
          top: 4px;
        `}
      >
        <Checkbox
          ref={checkboxRef}
          checked={suite.skip ? false : suite.checked}
          disabled={Boolean(suite.skip)}
          onValueChange={handleCheck}
        />
      </div>
    </div>
  );
}
