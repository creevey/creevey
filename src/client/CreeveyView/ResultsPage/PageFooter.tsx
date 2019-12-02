import React from 'react';
import { css } from '@emotion/core';
import Button from '@skbkontur/react-ui/Button';
import Paging from '@skbkontur/react-ui/Paging';

export interface PageFooterProps {
  isApproved: boolean;
  currentRetry: number;
  retriesCount: number;
  onRetryChange: (retry: number) => void;
  onApprove: () => void;
}

export function PageFooter({ isApproved, currentRetry, retriesCount, onRetryChange, onApprove }: PageFooterProps) {
  return (
    <div
      css={css`
        display: flex;
        flex-flow: column no-wrap;
        padding: 15px 20px;
        justify-content: space-between;
      `}
    >
      <Paging activePage={currentRetry} onPageChange={onRetryChange} pagesCount={retriesCount} />
      <div>
        {isApproved ? null : (
          <Button use="primary" onClick={onApprove} width="100px">
            {'Approve'}
          </Button>
        )}
      </div>
    </div>
  );
}
