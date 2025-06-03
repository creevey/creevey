import React, { JSX } from 'react';
import { styled, withTheme } from 'storybook/theming';
import { opacify } from 'polished';

const Container = withTheme(
  styled.span(({ theme }) => ({
    lineHeight: '10px',
    display: 'inline-block',
    position: 'relative',
    whiteSpace: 'nowrap',
    background: theme.base == 'light' ? theme.color.mediumlight : theme.color.darker,
    borderRadius: '3em',
    padding: 2,
    verticalAlign: 'middle',
    marginLeft: 10,

    input: {
      appearance: 'none',
      width: '100%',
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      margin: 0,
      padding: 0,
      border: 'none',
      cursor: 'pointer',

      '&:focus': {
        outline: 'none',
      },
    },

    span: {
      cursor: 'pointer',
      display: 'inline-block',
      transition: 'all 100ms ease-out',
      userSelect: 'none',
      borderRadius: '100%',
      background: theme.background.bar,
      boxShadow: `${opacify(0.1, theme.appBorderColor)} 0 0 2px`,
      color: theme.color.defaultText,
      width: 20,
      height: 20,
      boxSizing: 'border-box',
      lineHeight: '19px',
      textAlign: 'center',

      '&:hover': {
        boxShadow: `${opacify(0.3, theme.appBorderColor)} 0 0 0 1px inset`,
      },

      '&:active': {
        boxShadow: `${opacify(0.05, theme.appBorderColor)} 0 0 0 2px inset`,
      },
    },

    'input:checked ~ span': {
      marginLeft: 20,
    },

    'input:not(:checked) ~ span': {
      marginRight: 20,
    },
  })),
);

interface ToggleProps {
  value?: boolean;
  onChange: (val: boolean) => void;
}

export const Toggle = ({ value, onChange }: ToggleProps): JSX.Element => (
  <Container>
    <input
      type="checkbox"
      onChange={() => {
        onChange(!value);
      }}
      checked={value ?? false}
    />
    <span>{value ? '☪' : '☀'}</span>
  </Container>
);
