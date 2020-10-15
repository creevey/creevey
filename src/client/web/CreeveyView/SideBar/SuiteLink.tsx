import React, { useRef, useContext, useEffect } from 'react';
import { Checkbox } from './Checkbox';
import { Icons } from '@storybook/components';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveySuite, isTest } from '../../../../types';
import { CreeveyContext } from '../../../shared/CreeveyContext';
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

    '&:hover': {
      background: '#e5e5e5',
    },
  })),
);

export const Button = withTheme(
  styled.button<{ theme: Theme; active?: boolean }>(({ theme, active }) => ({
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none',
    background: active ? theme.color.secondary : 'none',
    color: active ? theme.color.inverseText : 'inherit',
    border: 'none',
    padding: '6px 36px 6px',
    lineHeight: '20px',
    cursor: 'pointer',
    outline: 'none',
    zIndex: 1,
    textAlign: 'left',
  })),
);

export const CheckboxContainer = styled.div({
  position: 'absolute',
  left: '64px',
  top: '4px',
  zIndex: 2,
});

const ArrawIcon = styled(Icons)({
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
  const checkboxRef = useRef<Checkbox>(null);
  useEffect(
    () => (suite.indeterminate ? checkboxRef.current?.setIndeterminate() : checkboxRef.current?.resetIndeterminate()),
    [suite.indeterminate],
  );

  const isRootSuite = suite.path.length == 0;

  const handleCheck = (value: boolean): void => onSuiteToggle(suite.path, value);
  const handleOpen = (): void => void (isRootSuite || onSuiteOpen(suite.path, !suite.opened));

  return (
    <Container>
      <Button onClick={handleOpen} data-tid={dataTid}>
        <TestStatusIcon status={suite.status} skip={suite.skip} />
        <SuiteContainer padding={Math.max(48, (suite.path.length + 5) * 8)}>
          {isTest(suite) ||
            (Boolean(suite.path.length) &&
              (suite.opened ? <ArrawIcon icon="arrowdown" /> : <ArrawIcon icon="arrowright" />))}
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
