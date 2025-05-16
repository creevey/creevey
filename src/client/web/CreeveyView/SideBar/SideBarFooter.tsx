import React, { JSX, useCallback, useEffect, useState } from 'react';
import { styled, withTheme } from '@storybook/theming';
import { Button } from '@storybook/components';
import { ChevronRightIcon } from '@storybook/icons';
import { useCreeveyContext } from '../../CreeveyContext.js';

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

export function SideBarFooter(): JSX.Element {
  const { onApproveAll, onImageApprove, onImageNext } = useCreeveyContext();
  const [isAlt, setIsAlt] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'AltLeft') {
      e.preventDefault();
      setIsAlt(true);
    }
  }, []);
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'AltLeft') {
      e.preventDefault();
      setIsAlt(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
      document.removeEventListener('keyup', handleKeyUp, false);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <>
      <Sticky>
        <Container>
          {isAlt ? (
            <Button variant="outline" size="medium" onClick={onImageNext} disabled={!onImageApprove}>
              Next
              <ChevronRightIcon />
            </Button>
          ) : (
            <Button variant="solid" size="medium" onClick={onImageApprove} disabled={!onImageApprove}>
              Approve
              <ChevronRightIcon />
            </Button>
          )}
          <Button variant="outline" size="medium" onClick={onApproveAll}>
            Approve all
          </Button>
        </Container>
      </Sticky>
    </>
  );
}
