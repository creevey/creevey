import React from 'react';
import { Theme } from 'storybook/theming';
import { TestStatus } from '../../../../types.js';
import { CreeveyTestsStatus } from '../../../shared/helpers.js';
export interface TestsStatusProps extends CreeveyTestsStatus {
    onClickByStatus: (value: TestStatus) => void;
    theme?: Theme;
}
export declare const TestsStatus: React.ForwardRefExoticComponent<Pick<TestsStatusProps, "successCount" | "failedCount" | "pendingCount" | "approvedCount" | "onClickByStatus"> & {
    theme?: Theme;
}>;
