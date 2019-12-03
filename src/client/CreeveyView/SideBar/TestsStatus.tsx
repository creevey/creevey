import React from 'react';
import { css } from '@emotion/core';
import OkIcon from '@skbkontur/react-icons/Ok';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import PauseIcon from '@skbkontur/react-icons/Pause';
import TrashIcon from '@skbkontur/react-icons/Trash';

export interface TestsStatusProps {
  successCount: number;
  failedCount: number;
  // Не уверен, что именно это подразумевалось
  pendingCount: number;
  skippedCount: number;
}

const Separator = () => (
  <span
    css={css`
      margin: 0 5px;
    `}
  >
    /
  </span>
);

export function TestsStatus({ successCount, failedCount, skippedCount, pendingCount }: TestsStatusProps): JSX.Element {
  return (
    <div
      css={css`
        display: flex;
        flex-flow: row nowrap;
        font-size: 14px;
        line-heightL 22px;
      `}
    >
      <div
        css={css`
          color: #228007;
        `}
      >
        <OkIcon />
        <span
          css={css`
            margin-left: 3px;
          `}
        >
          {successCount}
        </span>
      </div>
      <Separator />
      <div
        css={css`
          color: #ce0014;
        `}
      >
        <DeleteIcon />
        <span
          css={css`
            margin-left: 3px;
          `}
        >
          {failedCount}
        </span>
      </div>
      <Separator />
      <div>
        <PauseIcon />
        <span
          css={css`
            margin-left: 3px;
          `}
        >
          {pendingCount}
        </span>
      </div>
      <Separator />
      <div>
        <TrashIcon />
        <span
          css={css`
            margin-left: 3px;
          `}
        >
          {skippedCount}
        </span>
      </div>
    </div>
  );
}
