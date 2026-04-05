import { JSX } from 'react';
import { TestsStatusProps } from './TestsStatus.js';
import { CreeveyViewFilter } from '../../../shared/helpers.js';
interface SideBarHeaderProps {
    testsStatus: Omit<TestsStatusProps, 'onClickByStatus'>;
    onStart: () => void;
    onStop: () => void;
    filter: CreeveyViewFilter;
    onFilterChange: (value: CreeveyViewFilter) => void;
    canStart?: boolean;
}
export declare function SideBarHeader({ testsStatus, onStop, onStart, filter, onFilterChange, canStart, }: SideBarHeaderProps): JSX.Element;
export {};
