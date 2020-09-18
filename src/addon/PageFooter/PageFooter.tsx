import React from 'react';
import { Paging } from './Paging';
import { styled, withTheme } from '@storybook/theming';
import { Button } from '@storybook/components';

export interface PageFooterProps {
  canApprove: boolean;
  retriesCount: number;
  retry: number;
  onRetryChange: (retry: number) => void;
  onApprove: () => void;
}

const Container = withTheme(
  styled.div(({ theme }) => ({
    display: 'flex',
    padding: '24px 32px 16px',
    justifyContent: 'space-between',
    background: theme.background.content,
  })),
);

export function PageFooter({
  canApprove,
  retriesCount,
  retry,
  onRetryChange,
  onApprove,
}: PageFooterProps): JSX.Element {
  return (
    <Container>
      <Paging activePage={retry} onPageChange={onRetryChange} pagesCount={retriesCount} />
      {canApprove ? (
        <Button secondary outline onClick={onApprove}>
          {'Approve'}
        </Button>
      ) : null}
    </Container>
  );
}
