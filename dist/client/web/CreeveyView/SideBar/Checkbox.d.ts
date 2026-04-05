import React, { Component, JSX } from 'react';
import { Theme } from 'storybook/theming';
interface CheckboxProps {
    checked?: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
}
interface CheckboxState {
    indeterminate: boolean;
}
export declare const CheckboxContainer: import("storybook/theming", { with: { "resolution-mode": "import" } }).StyledComponent<{
    theme?: Theme;
    as?: React.ElementType;
}, React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, {}>;
export declare class Checkbox extends Component<CheckboxProps, CheckboxState> {
    state: CheckboxState;
    handleIndeterminateChange: (value: boolean) => void;
    setIndeterminate: () => void;
    resetIndeterminate: () => void;
    render(): JSX.Element;
}
export {};
