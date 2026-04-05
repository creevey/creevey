import { Theme } from 'storybook/theming';
export declare const themeBorderColors: {
    actual: string;
    expect: string;
    diff: string;
};
export declare function getBorderColor(theme: Theme, color: string): string;
export interface ViewProps {
    actual: string;
    diff: string;
    expect: string;
}
export interface ViewPropsWithTheme extends ViewProps {
    theme: Theme;
}
