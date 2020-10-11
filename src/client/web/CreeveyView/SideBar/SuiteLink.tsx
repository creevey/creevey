import React, { useRef, useContext, useEffect } from 'react';
import { Checkbox } from './Checkbox';
import { Icons } from '@storybook/components';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveySuite, isTest } from '../../../../types';
import { CreeveyContext } from '../../../shared/CreeveyContext';
import { styled, withTheme } from '@storybook/theming';

export interface SuiteLinkProps {
  title: string;
  suite: CreeveySuite;
}

export const Container = styled.div({
  position: 'relative',
  width: '100%',

  '&:hover': {
    background: '#e5e5e5',
  },
});

export const Button = withTheme(
  styled.button(({ theme }) => ({
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none',
    background: 'none',
    color: 'inherit',
    border: 'none',
    padding: '6px 36px 6px',
    lineHeight: '20px',
    cursor: 'pointer',
    outline: 'none',
    zIndex: 1,
    textAlign: 'left',

    '&:disabled': {
      color: theme.color.mediumdark,
    },
  })),
);

export const CheckboxContainer = styled.div({
  position: 'absolute',
  left: '64px',
  top: '7px',
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

export function SuiteLink({ title, suite }: SuiteLinkProps): JSX.Element {
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
      <Button onClick={handleOpen}>
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
