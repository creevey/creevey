import React, { JSX } from 'react';
import { Theme } from 'storybook/theming';
import { CreeveySuite } from '../../../../types.js';
export interface SuiteLinkProps {
    title: string;
    suite: CreeveySuite;
    'data-testid'?: string;
}
export declare const Container: React.ForwardRefExoticComponent<Pick<{
    theme?: Theme;
    as?: React.ElementType;
} & {
    theme: Theme;
    disabled?: boolean;
    active?: boolean;
    focused?: boolean;
} & React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement>, "disabled" | "active" | "as" | keyof React.ClassAttributes<HTMLDivElement> | keyof React.HTMLAttributes<HTMLDivElement> | "focused"> & {
    theme?: Theme;
}>;
export declare const Button: React.ForwardRefExoticComponent<Pick<{
    theme?: Theme;
    as?: React.ElementType;
} & {
    theme: Theme;
    active?: boolean;
} & React.ClassAttributes<HTMLButtonElement> & React.ButtonHTMLAttributes<HTMLButtonElement>, "active" | "as" | keyof React.ClassAttributes<HTMLButtonElement> | keyof React.ButtonHTMLAttributes<HTMLButtonElement>> & {
    theme?: Theme;
}>;
export declare const SuiteContainer: import("storybook/theming", { with: { "resolution-mode": "import" } }).StyledComponent<{
    theme?: Theme;
    as?: React.ElementType;
} & {
    padding: number;
}, React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, {}>;
export declare const SuiteTitle: import("storybook/theming", { with: { "resolution-mode": "import" } }).StyledComponent<{
    theme?: Theme;
    as?: React.ElementType;
}, React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, {}>;
export declare function SuiteLink({ title, suite, 'data-testid': dataTid }: SuiteLinkProps): JSX.Element;
