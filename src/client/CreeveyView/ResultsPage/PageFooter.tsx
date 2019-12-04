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

export function PageFooter({
  isApproved,
  currentRetry,
  retriesCount,
  onRetryChange,
  onApprove,
}: PageFooterProps): JSX.Element {
  return (
    <div
      css={css`
        display: flex;
        padding: 24px 32px 16px;
        justify-content: space-between;
        background: #fff;
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
