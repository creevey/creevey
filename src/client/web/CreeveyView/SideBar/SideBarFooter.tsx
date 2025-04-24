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

const UpdateModeBanner = withTheme(
  styled.div(({ theme }) => ({
    position: 'absolute',
    bottom: '65px',
    left: 0,
    right: 0,
    padding: '8px 32px',
    backgroundColor: `${theme.color.positive}20`,
    color: theme.color.positive,
    fontSize: '12px',
    textAlign: 'center',
    fontWeight: 'bold',
    borderTop: `1px solid ${theme.color.positive}50`,
    borderBottom: `1px solid ${theme.color.positive}50`,
  })),
);

export function SideBarFooter(): JSX.Element {
  const { onApproveAll, onImageApprove, onImageNext, isUpdateMode } = useCreeveyContext();
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
      {isUpdateMode && (
        <UpdateModeBanner>Update Mode: Review and approve screenshots from previous test runs</UpdateModeBanner>
      )}
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
