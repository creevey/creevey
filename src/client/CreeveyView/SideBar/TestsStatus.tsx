import React from 'react';
import { css } from '@emotion/core';
import OkIcon from '@skbkontur/react-icons/Ok';
import ClockIcon from '@skbkontur/react-icons/Clock';
import DeleteIcon from '@skbkontur/react-icons/Delete';
import PauseIcon from '@skbkontur/react-icons/Pause';
import TrashIcon from '@skbkontur/react-icons/Trash';
import { Button, ThemeContext, ThemeFactory } from '@skbkontur/react-ui';
import { TestStatus } from '../../../types';

const StatusButtonsTheme = ThemeFactory.create({ linkHoverTextDecoration: 'none' });

export interface TestsStatusProps {
  successCount: number;
  failedCount: number;
  pendingCount: number;
  skippedCount: number;
  removedCount: number;
  onClickByStatus: (value: TestStatus) => void;
}

export function TestsStatus({
  successCount,
  failedCount,
  pendingCount,
  skippedCount,
  removedCount,
  onClickByStatus,
}: TestsStatusProps): JSX.Element {
  return (
    <ThemeContext.Provider value={StatusButtonsTheme}>
      <div
        css={css`
          font-size: 14px;
          line-height: 22px;
          width: 230px;
        `}
      >
        {pendingCount > 0 && (
          <>
            <Button use="link" narrow onClick={() => onClickByStatus('pending')}>
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
        <Button use="link" narrow onClick={() => onClickByStatus('success')}>
          <span
            css={css`
              color: #228007;
            `}
          >
            <OkIcon /> {successCount}
          </span>
        </Button>
        {' / '}
        <Button use="link" narrow onClick={() => onClickByStatus('failed')}>
          <span
            css={css`
              color: #ce0014;
            `}
          >
            <DeleteIcon /> {failedCount}
          </span>
        </Button>
        {' / '}
        <span>
          <PauseIcon /> {skippedCount}
        </span>
        {' / '}
        <span>
          <TrashIcon /> {removedCount}
        </span>
      </div>
    </ThemeContext.Provider>
  );
}
