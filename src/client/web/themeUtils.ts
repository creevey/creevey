const CREEVEY_THEME = 'Creevey_theme';

export const isUseDarkTheme = (): boolean => {
  const item = localStorage.getItem(CREEVEY_THEME);
  return item === 'dark';
};

export const setUseDarkTheme = (isDark: boolean): void => {
  localStorage.setItem(CREEVEY_THEME, isDark ? 'dark' : 'light');
};
