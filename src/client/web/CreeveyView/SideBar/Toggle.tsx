import React from 'react';

import { styled, withTheme } from '@storybook/theming';
import { opacify } from 'polished';

const Container = withTheme(
  styled.span(({ theme }) => ({
    lineHeight: '10px',
    display: 'inline-block',
    position: 'relative',
    whiteSpace: 'nowrap',
    background: `${opacify(0.05, theme.appBorderColor)}`,
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
        boxShadow: `${theme.color.secondary} 0 0 0 1px inset !important`,
      },
    },

    span: {
      cursor: 'pointer',
      display: 'inline-block',
      width: 10,
      transition: 'all 100ms ease-out',
      userSelect: 'none',
      borderRadius: '100%',

      '&:hover': {
        boxShadow: `${opacify(0.3, theme.appBorderColor)} 0 0 0 1px inset`,
      },

      '&:active': {
        boxShadow: `${opacify(0.05, theme.appBorderColor)} 0 0 0 2px inset`,
      },

      '&:first-of-type': {
        paddingRight: 8,
      },
      '&:last-of-type': {
        paddingLeft: 8,
      },
    },

    'input:checked ~ span:last-of-type, input:not(:checked) ~ span:first-of-type': {
      background: theme.background.bar,
      boxShadow: `${opacify(0.1, theme.appBorderColor)} 0 0 2px`,
      color: theme.color.defaultText,
      width: 20,
      height: 20,
      boxSizing: 'border-box',
    },
  })),
);

interface ToggleProps {
  value?: boolean;
  name: string;
  title: string;
  onChange: (val: boolean) => void;
}

export const Toggle = ({ value, name, title, onChange }: ToggleProps): JSX.Element => (
  <>
    <label htmlFor={name} title={title}>
      {title}
    </label>
    <Container>
      <input id={name} type="checkbox" onChange={() => onChange(!value)} checked={value || false} />
      <span></span>
      <span></span>
    </Container>
  </>
);
