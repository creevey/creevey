import React, { JSX, useRef, useContext, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@storybook/icons';
import { styled, withTheme, Theme } from '@storybook/theming';
import { Checkbox, CheckboxContainer } from './Checkbox.js';
import { TestStatusIcon } from './TestStatusIcon.js';
import { CreeveySuite, isTest } from '../../../../types.js';
import { CreeveyContext } from '../../CreeveyContext.js';
import { KeyboardEventsContext } from '../../KeyboardEventsContext.js';

export interface SuiteLinkProps {
  title: string;
  suite: CreeveySuite;
  'data-testid'?: string;
}

export const Container = withTheme(
  styled.div<{ theme: Theme; disabled?: boolean; active?: boolean; focused?: boolean }>(
    ({ theme, disabled, active, focused }) => ({
      position: 'relative',
      width: '100%',
      height: '28px',
      lineHeight: '20px',
      display: 'flex',
      background: active ? theme.color.secondary : focused ? theme.background.hoverable : 'none',
      color: active ? theme.color.inverseText : 'inherit',
      outline: focused ? `1px solid ${theme.color.ancillary}` : 'none',
      ...(disabled ? { color: theme.color.mediumdark, pointerEvents: 'none' } : {}),

      // NOTE There is no way to trigger hover from js, so we add `.hover` class for testing purpose
      '&:hover, &.hover': active
        ? {}
        : {
            background: theme.background.hoverable,
          },
    }),
  ),
);

export const Button = withTheme(
  styled.button<{ theme: Theme; active?: boolean }>(({ theme, active }) => ({
    flexGrow: 1,
    boxSizing: 'border-box',
    appearance: 'none',
    padding: '4px 16px 4px 8px',
    lineHeight: '18px',
    cursor: 'pointer',
    border: 'none',
    zIndex: 1,
    textAlign: 'left',
    background: 'none',
    outline: 'none',
    color: active ? theme.color.inverseText : 'inherit',
  })),
);

const iconStyles = {
  paddingRight: '4px',
  display: 'inline-block',
  width: '12px',
  height: '18px',
  verticalAlign: 'unset',
};

const ChevronDownIconStyled = styled(ChevronDownIcon)(iconStyles);
const ChevronRightIconStyled = styled(ChevronRightIcon)(iconStyles);

export const SuiteContainer = styled.span<{ padding: number }>(({ padding }) => ({
  paddingLeft: padding,
  whiteSpace: 'normal',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, min-content) auto',
}));

export const SuiteTitle = styled.span({
  paddingLeft: '4px',
  whiteSpace: 'nowrap',
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
});

export function SuiteLink({ title, suite, 'data-testid': dataTid }: SuiteLinkProps): JSX.Element {
  const { onSuiteOpen, onSuiteToggle } = useContext(CreeveyContext);
  const { sidebarFocusedItem, setSidebarFocusedItem } = useContext(KeyboardEventsContext);
  const checkboxRef = useRef<Checkbox>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isSuiteFocused = useMemo(
    () =>
      Array.isArray(sidebarFocusedItem) &&
      sidebarFocusedItem.length === suite.path.length &&
      sidebarFocusedItem.every((x) => suite.path.includes(x)),
    [suite, sidebarFocusedItem],
  );

  useEffect(
    () => (suite.indeterminate ? checkboxRef.current?.setIndeterminate() : checkboxRef.current?.resetIndeterminate()),
    [suite.indeterminate],
  );

  useEffect(() => {
    if (isSuiteFocused) buttonRef.current?.focus();
  }, [isSuiteFocused]);

  const isRootSuite = suite.path.length == 0;

  const handleCheck = (value: boolean): void => {
    onSuiteToggle(suite.path, value);
  };
  const handleOpen = (): void => {
    if (!isRootSuite) {
      onSuiteOpen(suite.path, !suite.opened);
      setSidebarFocusedItem(suite.path);
    }
  };
  const handleFocus = (): void => {
    setSidebarFocusedItem(suite.path);
  };

  return (
    <Container focused={isSuiteFocused}>
      <CheckboxContainer>
        <Checkbox
          ref={checkboxRef}
          checked={suite.skip ? false : suite.checked}
          disabled={Boolean(suite.skip)}
          onValueChange={handleCheck}
        />
      </CheckboxContainer>
      <Button onClick={handleOpen} onFocus={handleFocus} data-testid={dataTid} ref={buttonRef}>
        <SuiteContainer padding={(suite.path.length - 1) * 8}>
          {isTest(suite) ||
            (Boolean(suite.path.length) && (suite.opened ? <ChevronDownIconStyled /> : <ChevronRightIconStyled />))}
          <TestStatusIcon status={suite.status} skip={suite.skip} />
          <SuiteTitle>{title}</SuiteTitle>
        </SuiteContainer>
      </Button>
    </Container>
  );
}
