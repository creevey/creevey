import React, { useContext } from 'react';
import { css } from '@emotion/core';
import Checkbox from '@skbkontur/react-ui/Checkbox';
import Button from '@skbkontur/react-ui/Button';
import { CreeveyTest } from '../../../types';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveyContex } from '../../CreeveyContext';
import { SideBarContext } from './SideBar';

export interface TestLinkProps {
  title: string;
  opened: boolean;
  test: CreeveyTest;
}

export function TestLink({ title, opened, test }: TestLinkProps): JSX.Element {
  const { onSuiteToggle } = useContext(CreeveyContex);
  const { onOpenTest } = useContext(SideBarContext);

  const emptyResults = (test?.results?.length ?? 0) == 0;

  const handleCheck = (_: React.ChangeEvent, value: boolean): void => onSuiteToggle(test.path, value);
  const handleOpen = (): void => onOpenTest(test.path);

  return (
    <Button width="100%" align="left" checked={opened} disabled={emptyResults} onClick={handleOpen}>
      <TestStatusIcon inverted={opened} status={test.status} />
      <span
        css={css`
          padding-left: 16px;
        `}
      >
        <Checkbox checked={test.skip ? false : test.checked} disabled={Boolean(test.skip)} onChange={handleCheck} />
      </span>
      <span
        css={css`
          padding-left: ${(test.path.length + 4) * 8}px;
        `}
      >
        {title}
      </span>
    </Button>
  );
}
