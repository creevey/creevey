/* eslint-disable @typescript-eslint/no-empty-object-type */

import 'storybook/theming';
import type { StorybookTheme } from 'storybook/theming';

declare module 'storybook/theming' {
  interface Theme extends StorybookTheme {}
}

export {};
