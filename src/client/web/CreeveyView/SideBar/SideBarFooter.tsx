import React from 'react';
import { styled, withTheme } from '@storybook/theming';
import { Button, Icons } from '@storybook/components';

interface SideBarFooterProps {
  onApproveAll: () => void;
}

const Sticky = withTheme(
  styled.div(({ theme }) => ({
    padding: '24px 32px 8px',
    background: theme.background.content,
    height: '50px',
    zIndex: 5,
    position: 'sticky',
    bottom: '0',
  })),
);

const Container = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
});

export function SideBarFooter({ onApproveAll }: SideBarFooterProps): JSX.Element {
  return (
    <Sticky>
      <Container>
        <Button secondary outline onClick={onApproveAll}>
          Approve all
        </Button>

        <Button secondary outline>
          <Icons icon="arrowright" />
        </Button>
      </Container>
    </Sticky>
  );
}
