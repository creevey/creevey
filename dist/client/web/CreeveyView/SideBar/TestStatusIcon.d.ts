import React from 'react';
import { Theme } from 'storybook/theming';
import { TestStatus } from '../../../../types.js';
export interface TestStatusIconProps {
    inverted?: boolean;
    status?: TestStatus;
    skip?: string | boolean;
    theme: Theme;
}
export declare const TestStatusIcon: React.ForwardRefExoticComponent<Pick<TestStatusIconProps, "skip" | "status" | "inverted"> & {
    theme?: Theme;
}>;
