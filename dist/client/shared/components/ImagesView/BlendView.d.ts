import React from 'react';
import { ViewPropsWithTheme } from './common.js';
export declare const BlendView: React.ForwardRefExoticComponent<Pick<ViewPropsWithTheme, "actual" | "expect" | "diff"> & {
    theme?: import("storybook/theming", { with: { "resolution-mode": "import" } }).Theme;
}>;
