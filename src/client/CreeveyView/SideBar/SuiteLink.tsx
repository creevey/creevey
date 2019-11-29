import React, { ReactNode, useRef, useContext, useState, useEffect } from 'react';
import { css } from '@emotion/core';
import Gapped from '@skbkontur/react-ui/Gapped';
import ArrowTriangleRightIcon from '@skbkontur/react-icons/ArrowTriangleRight';
import Checkbox from '@skbkontur/react-ui/Checkbox';
import Button from '@skbkontur/react-ui/Button';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveySuite } from '../../../types';
import { CreeveyContex } from '../../CreeveyContext';

export interface SuiteLinkProps {
  title: string;
  suite: CreeveySuite;
  children: ReactNode;
}

export function SuiteLink({ title, suite, children }: SuiteLinkProps): JSX.Element {
  const { onTestOrSuiteToggle } = useContext(CreeveyContex);
  const [opened, setOpen] = useState(false);
  const checkboxRef = useRef<Checkbox>(null);
  useEffect(
    () => (suite.indeterminate ? checkboxRef.current?.setIndeterminate() : checkboxRef.current?.resetIndeterminate()),
    [suite.indeterminate],
  );

  const handleCheck = (_: React.ChangeEvent, value: boolean): void => onTestOrSuiteToggle(suite.path, value);
  const handleOpen = (): void => setOpen(!opened);

  return (
    <>
      <Gapped gap={5}>
        <span
          css={css`
            display: inline-block;
            cursor: pointer;
            transform: ${opened ? 'rotate(45deg)' : ''};
          `}
        >
          <ArrowTriangleRightIcon onClick={handleOpen} />
        </span>
        <Gapped gap={5}>
          <Checkbox
            ref={checkboxRef}
            checked={suite.skip ? false : suite.checked}
            disabled={Boolean(suite.skip)}
            onChange={handleCheck}
          />
          <Button use="link" onClick={handleOpen}>
            {title}
          </Button>
        </Gapped>
        <TestStatusIcon status={suite.status} />
      </Gapped>
      {opened && (
        <div
          css={css`
            margin-left: 20px;
          `}
        >
          {children}
        </div>
      )}
    </>
  );
}
