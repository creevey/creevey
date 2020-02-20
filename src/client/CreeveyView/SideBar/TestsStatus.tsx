import React from 'react';
import { css } from '@emotion/core';
import OkIcon from '@skbkontur/react-icons/Ok';
import ClockIcon from '@skbkontur/react-icons/Clock';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import PauseIcon from '@skbkontur/react-icons/Pause';
import TrashIcon from '@skbkontur/react-icons/Trash';
import Button from '@skbkontur/react-ui/Button';
import ThemeProvider from '@skbkontur/react-ui/ThemeProvider';

export interface TestsStatusProps {
  successCount: number;
  failedCount: number;
  pendingCount: number;
  skippedCount: number;
  removedCount: number;
  onClick: (value: string) => void;
}

export function TestsStatus({
  successCount,
  failedCount,
  pendingCount,
  skippedCount,
  removedCount,
  onClick,
}: TestsStatusProps): JSX.Element {
  const handleClick = (status: string): void => {
    onClick(`status:${status}`);
  };
  return (
    <ThemeProvider value={{ linkHoverTextDecoration: 'none' }}>
      <div
        css={css`
          font-size: 14px;
          line-height: 22px;
          width: 230px;
        `}
      >
        {pendingCount > 0 && (
          <>
            <Button use="link" narrow onClick={() => handleClick('pending')}>
              <span
                css={css`
                  color: #a0a0a0;
                `}
              >
                <ClockIcon /> {pendingCount}
              </span>
            </Button>
            {' / '}
          </>
        )}
        <Button use="link" narrow onClick={() => handleClick('success')}>
          <span
            css={css`
              color: #228007;
            `}
          >
            <OkIcon /> {successCount}
          </span>
        </Button>
        {' / '}
        <Button use="link" narrow onClick={() => handleClick('failed')}>
          <span
            css={css`
              color: #ce0014;
            `}
          >
            <DeleteIcon /> {failedCount}
          </span>
        </Button>
        {' / '}
        <Button use="link" narrow onClick={() => handleClick('skipped')}>
          <span
            css={css`
              color: #000000;
            `}
          >
            <PauseIcon /> {skippedCount}
          </span>
        </Button>
        {' / '}
        <Button use="link" narrow onClick={() => handleClick('null')}>
          <span
            css={css`
              color: #000000;
            `}
          >
            <TrashIcon /> {removedCount}
          </span>
        </Button>
      </div>
    </ThemeProvider>
  );
}
