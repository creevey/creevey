import React from 'react';
import { Button, Spaced } from '@storybook/components';
import { styled, withTheme } from '@storybook/theming';
import { Paging } from './Paging.js';

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
    padding: '20px',
    justifyContent: 'space-between',
    background: theme.background.content,
  })),
);

const StyledButton = styled(Button)({
  transform: 'none',
});

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
      <Spaced col={2} row={1}>
        {canApprove ? (
          <StyledButton secondary onClick={onApprove}>
            Approve
          </StyledButton>
        ) : null}
      </Spaced>
    </Container>
  );
}
