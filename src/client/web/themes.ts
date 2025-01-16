import { useEffect, useState } from 'react';
import { themes, ThemeVars } from '@storybook/theming';
import { isDefined } from '../../types.js';

const CREEVEY_THEME = 'Creevey_theme';

function isTheme(theme?: string | null): theme is ThemeVars['base'] {
  return isDefined(theme) && Object.prototype.hasOwnProperty.call(themes, theme);
}

function initialTheme(): ThemeVars['base'] {
  const theme = localStorage.getItem(CREEVEY_THEME);
  return isTheme(theme) ? theme : 'light';
}

export function useTheme(): [ThemeVars['base'], (theme: ThemeVars['base']) => void] {
  const [theme, setTheme] = useState<ThemeVars['base']>(initialTheme());

  useEffect(() => {
    localStorage.setItem(CREEVEY_THEME, theme);
  }, [theme]);

  return [theme, setTheme];
}
