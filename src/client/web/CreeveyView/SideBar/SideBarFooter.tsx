import React from 'react';
import { styled, withTheme } from '@storybook/theming';
import { Button, Icons } from '@storybook/components';
import { useCreeveyContext } from '../../CreeveyContext.js';

const Sticky = withTheme(
  styled.div(({ theme }) => ({
    padding: '24px 16px 8px 16px',
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

export function SideBarFooter(): JSX.Element {
  const { onApproveAll, onImageApprove } = useCreeveyContext();

  return (
    <Sticky>
      <Container>
        <Button secondary onClick={onImageApprove} disabled={!onImageApprove} style={{ paddingRight: 8 }}>
          Approve
          <Icons icon="arrowright" style={{ paddingLeft: 4 }} />
        </Button>
        <Button secondary outline onClick={onApproveAll}>
          Approve all
        </Button>
      </Container>
    </Sticky>
  );
}
