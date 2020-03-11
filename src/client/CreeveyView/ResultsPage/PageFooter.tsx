import React, { useState } from 'react';
import { css } from '@emotion/core';
import { Button, Paging } from '@skbkontur/react-ui';

export interface PageFooterProps {
  canApprove: boolean;
  retriesCount: number;
  onRetryChange: (retry: number) => void;
  onApprove: () => void;
}

export function PageFooter({ canApprove, retriesCount, onRetryChange, onApprove }: PageFooterProps): JSX.Element {
  const [retry, setRetry] = useState(retriesCount);

  const handlePageChange = (page: number): void => (setRetry(page), onRetryChange(page));

  return (
    <div
      css={css`
        display: flex;
        padding: 24px 32px 16px;
        justify-content: space-between;
        background: #fff;
      `}
    >
      <Paging activePage={retry} onPageChange={handlePageChange} pagesCount={retriesCount} />
      <div>
        {canApprove ? (
          <Button use="primary" onClick={onApprove} width="100px">
            {'Approve'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
