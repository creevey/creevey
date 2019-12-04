import React from 'react';
import { css } from '@emotion/core';
import OkIcon from '@skbkontur/react-icons/Ok';
import ClockIcon from '@skbkontur/react-icons/Clock';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import PauseIcon from '@skbkontur/react-icons/Pause';
import TrashIcon from '@skbkontur/react-icons/Trash';

export interface TestsStatusProps {
  successCount: number;
  failedCount: number;
  pendingCount: number;
  skippedCount: number;
  removedCount: number;
}

export function TestsStatus({
  successCount,
  failedCount,
  pendingCount,
  skippedCount,
  removedCount,
}: TestsStatusProps): JSX.Element {
  return (
    <div
      css={css`
        font-size: 14px;
        line-height: 22px;
        width: 230px;
      `}
    >
      {pendingCount > 0 && (
        <>
          <span
            css={css`
              color: #a0a0a0;
            `}
          >
            <ClockIcon /> {pendingCount}
          </span>
          {' / '}
        </>
      )}
      <span
        css={css`
          color: #228007;
        `}
      >
        <OkIcon /> {successCount}
      </span>
      {' / '}
      <span
        css={css`
          color: #ce0014;
        `}
      >
        <DeleteIcon /> {failedCount}
      </span>
      {' / '}
      <span>
        <PauseIcon /> {skippedCount}
      </span>
      {' / '}
      <span>
        <TrashIcon /> {removedCount}
      </span>
    </div>
  );
}
