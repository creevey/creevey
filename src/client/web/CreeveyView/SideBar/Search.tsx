import React, { JSX, ChangeEvent, useRef, useState } from 'react';
import { SearchIcon, CloseAltIcon } from '@storybook/icons';
import { styled, Theme, withTheme } from 'storybook/theming';
import { useCreeveyContext } from '../../CreeveyContext.js';

interface SearchProps {
  onChange: (arg: string) => void;
  value: string;
}

const FilterField = withTheme(
  styled.input(({ theme }) => ({
    appearance: 'none',
    border: 'none',
    boxSizing: 'border-box',
    display: 'block',
    outline: 'none',
    width: '100%',
    background: 'transparent',
    padding: 0,
    fontSize: 'inherit',

    '&:-webkit-autofill': { WebkitBoxShadow: `0 0 0 3em ${theme.color.lightest} inset` },

    '::placeholder': {
      color: theme.color.mediumdark,
    },

    '&:placeholder-shown ~ button': {
      opacity: 0,
    },
  })),
);

const CancelButton = withTheme(
  styled.button(({ theme }) => ({
    border: 0,
    margin: 0,
    padding: 4,
    textDecoration: 'none',

    background: theme.appBorderColor,
    borderRadius: '1em',
    cursor: 'pointer',
    opacity: 1,
    transition: 'all 150ms ease-out',

    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    right: 2,

    '> svg': {
      display: 'block',
      height: 8,
      width: 8,
      color: theme.input.color,
      transition: 'all 150ms ease-out',
    },
  })),
);

const FilterForm = withTheme(
  styled.form<{ theme: Theme; focussed: boolean }>(({ theme, focussed }) => ({
    transition: 'all 150ms ease-out',
    borderBottom: '1px solid transparent',
    borderBottomColor: theme.appBorderColor,
    outline: 0,
    position: 'relative',
    color: theme.input.color,

    input: {
      color: theme.input.color,
      fontSize: theme.typography.size.s2 - 1,
      lineHeight: '20px',
      paddingTop: 2,
      paddingBottom: 2,
      paddingLeft: 20,
      paddingRight: 20,
    },

    '> svg': {
      transition: 'all 150ms ease-out',
      position: 'absolute',
      top: '50%',
      height: 12,
      width: 12,
      transform: 'translateY(-50%)',
      zIndex: 1,

      background: 'transparent',

      path: {
        transition: 'all 150ms ease-out',
        fill: 'currentColor',
        opacity: focussed ? 1 : 0.3,
      },
    },
  })),
);

export const Search = ({ onChange, value }: SearchProps): JSX.Element => {
  const { setSidebarFocusedItem } = useCreeveyContext();
  const [focussed, onSetFocussed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <FilterForm
      autoComplete="off"
      focussed={focussed}
      onReset={() => {
        onChange('');
      }}
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <FilterField
        type="text"
        ref={searchRef}
        onFocus={() => {
          onSetFocussed(true);
          setSidebarFocusedItem(null);
        }}
        onBlur={() => {
          onSetFocussed(false);
        }}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
        placeholder="search by status or substring"
        value={value}
      />
      <SearchIcon />
      <CancelButton tabIndex={-1} type="reset" value="reset" title="Clear search">
        <CloseAltIcon />
      </CancelButton>
    </FilterForm>
  );
};
