import { Color, Theme } from '@storybook/theming';

export const themeBorderColors = {
  actual: 'negative',
  expect: 'positive',
  diff: 'secondary',
};

const isColor = (theme: Theme, color: string): color is keyof Color => color in theme.color;

export function getBorderColor(theme: Theme, color: string): string {
  return isColor(theme, color) ? theme.color[color] : color;
}

export interface ViewProps {
  actual: string;
  diff: string;
  expect: string;
}

export interface ViewPropsWithTheme extends ViewProps {
  theme: Theme;
}
