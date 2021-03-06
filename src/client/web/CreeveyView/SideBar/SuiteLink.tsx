import React, { useRef, useContext, useEffect, useMemo } from 'react';
import { Checkbox } from './Checkbox';
import { Icons } from '@storybook/components';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveySuite, isTest } from '../../../../types';
import { CreeveyContext } from '../../CreeveyContext';
import { KeyboardEventsContext } from '../../KeyboardEventsContext';
import { styled, withTheme, Theme } from '@storybook/theming';

export interface SuiteLinkProps {
  title: string;
  suite: CreeveySuite;
  'data-tid'?: string;
}

export const Container = withTheme(
  styled.div<{ theme: Theme; disabled?: boolean }>(({ theme, disabled }) => ({
    position: 'relative',
    width: '100%',
    ...(disabled ? { color: theme.color.mediumdark, pointerEvents: 'none' } : {}),
  })),
);

export const Button = withTheme(
  styled.button<{ theme: Theme; active?: boolean; focused?: boolean }>(({ theme, active, focused }) => ({
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none',
    border: '1px solid transparent',
    padding: '6px 36px 6px',
    lineHeight: '20px',
    cursor: 'pointer',
    outline: 'none',
    zIndex: 1,
    textAlign: 'left',
    background: active ? theme.color.secondary : focused ? theme.background.hoverable : 'none',
    color: active ? theme.color.inverseText : 'inherit',
    borderColor: focused ? theme.color.ancillary : 'transparent',

    '&:hover': {
      background: theme.background.hoverable,
    },
  })),
);

export const CheckboxContainer = styled.div({
  position: 'absolute',
  left: '64px',
  top: '4px',
  zIndex: 2,
});

const ArrowIcon = styled(Icons)({
  paddingRight: '8px',
  display: 'inline-block',
  width: '16px',
  height: '11px',
});

export const SuiteContainer = styled.span<{ padding: number }>(({ padding }) => ({
  paddingLeft: padding,
  whiteSpace: 'normal',
}));

export function SuiteLink({ title, suite, 'data-tid': dataTid }: SuiteLinkProps): JSX.Element {
  const { onSuiteOpen, onSuiteToggle } = useContext(CreeveyContext);
  const { sidebarFocusedItem, setSidebarFocusedItem } = useContext(KeyboardEventsContext);
  const checkboxRef = useRef<Checkbox>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isSuiteFocused = useMemo(
    () => sidebarFocusedItem.length === suite.path.length && sidebarFocusedItem.every((x) => suite.path.includes(x)),
    [suite, sidebarFocusedItem],
  );
  useEffect(
    () => (suite.indeterminate ? checkboxRef.current?.setIndeterminate() : checkboxRef.current?.resetIndeterminate()),
    [suite.indeterminate],
  );

  useEffect(() => {
    if (isSuiteFocused && buttonRef && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isSuiteFocused]);

  const isRootSuite = suite.path.length == 0;

  const handleCheck = (value: boolean): void => onSuiteToggle(suite.path, value);
  const handleOpen = (): void => {
    if (!isRootSuite) {
      onSuiteOpen(suite.path, !suite.opened);
      setSidebarFocusedItem(suite.path);
    }
  };

  return (
    <Container>
      <Button onClick={handleOpen} data-tid={dataTid} focused={isSuiteFocused} ref={buttonRef}>
        <TestStatusIcon status={suite.status} skip={suite.skip} />
        <SuiteContainer padding={Math.max(48, (suite.path.length + 5) * 8)}>
          {isTest(suite) ||
            (Boolean(suite.path.length) &&
              (suite.opened ? <ArrowIcon icon="arrowdown" /> : <ArrowIcon icon="arrowright" />))}
          {title}
        </SuiteContainer>
      </Button>
      <CheckboxContainer>
        <Checkbox
          ref={checkboxRef}
          checked={suite.skip ? false : suite.checked}
          disabled={Boolean(suite.skip)}
          onValueChange={handleCheck}
        />
      </CheckboxContainer>
    </Container>
  );
}
