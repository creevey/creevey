import React, { useContext } from 'react';
import { css } from '@emotion/core';
import Gapped from '@skbkontur/react-ui/Gapped';
import Checkbox from '@skbkontur/react-ui/Checkbox';
import Button from '@skbkontur/react-ui/Button';
import { CreeveyTest } from '../../../types';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveyContex } from '../../CreeveyContext';
import { SideBarContext } from './SideBar';

export interface TestLinkProps {
  title: string;
  test: CreeveyTest;
}

export function TestLink({ title, test }: TestLinkProps): JSX.Element {
  const { onTestOrSuiteToggle } = useContext(CreeveyContex);
  const { onOpenTest } = useContext(SideBarContext);

  const emptyResults = !test.results || test.results.length == 0;

  const handleCheck = (_: React.ChangeEvent, value: boolean): void => onTestOrSuiteToggle(test.path, value);
  const handleOpen = (): void => onOpenTest(test);

  return (
    <div
      css={css`
        margin-left: 20px;
      `}
    >
      <Gapped gap={5}>
        <Gapped gap={5}>
          <Checkbox checked={test.skip ? false : test.checked} disabled={Boolean(test.skip)} onChange={handleCheck} />
          <Button use="link" disabled={emptyResults} onClick={handleOpen}>
            {title}
          </Button>
        </Gapped>
        <TestStatusIcon status={test.status} />
      </Gapped>
    </div>
  );
}
