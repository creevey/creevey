import React from 'react';
import { styled, withTheme } from '@storybook/theming';
import { Paging } from './Paging.js';

export interface PageFooterProps {
  retriesCount: number;
  retry: number;
  onRetryChange: (retry: number) => void;
}

const Container = withTheme(
  styled.div(({ theme }) => ({
    display: 'flex',
    padding: '24px 32px 20px',
    justifyContent: 'space-between',
    background: theme.background.content,
  })),
);

export function PageFooter({ retriesCount, retry, onRetryChange }: PageFooterProps): JSX.Element {
  return (
    <Container>
      <Paging activePage={retry} onPageChange={onRetryChange} pagesCount={retriesCount} />
    </Container>
  );
}
