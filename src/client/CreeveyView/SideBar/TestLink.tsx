import React, { useContext } from 'react';
import { css } from '@emotion/core';
import Checkbox from '@skbkontur/react-ui/Checkbox';
import Button from '@skbkontur/react-ui/Button';
import { CreeveyTest } from '../../../types';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveyContext } from '../../CreeveyContext';
import { SideBarContext } from './SideBar';

export interface TestLinkProps {
  title: string;
  opened: boolean;
  test: CreeveyTest;
}

export function TestLink({ title, opened, test }: TestLinkProps): JSX.Element {
  const { onSuiteToggle } = useContext(CreeveyContext);
  const { onOpenTest } = useContext(SideBarContext);

  const emptyResults = (test?.results?.length ?? 0) == 0;

  const handleCheck = (_: React.ChangeEvent, value: boolean): void => onSuiteToggle(test.path, value);
  const handleOpen = (): void => onOpenTest(test.path);

  return (
    <div
      css={css`
        position: relative;

        ${emptyResults ? '' : '&:hover { background: #e5e5e5; }'}
      `}
    >
      <Button width="100%" align="left" checked={opened} disabled={emptyResults} onClick={handleOpen}>
        <TestStatusIcon inverted={opened} status={test.status} skip={test.skip} />
        <span
          css={css`
            padding-left: ${(test.path.length + 8) * 8}px;
            white-space: normal;
          `}
        >
          {title}
        </span>
      </Button>
      {/* NOTE Little hack to allow click on checkbox and don't trigger Button click */}
      {/* We can use other approach, but checkbox has vertical-align: top */}
      <div
        css={css`
          position: absolute;
          left: 66px;
          top: 4px;
        `}
      >
        <Checkbox checked={test.skip ? false : test.checked} disabled={Boolean(test.skip)} onChange={handleCheck} />
      </div>
    </div>
  );
}
