import React, { JSX } from 'react';
import { CreeveySuite, CreeveyTest } from '../../../../types.js';
import { CreeveyViewFilter } from '../../../shared/helpers.js';
export declare const SideBarContext: React.Context<{
    onOpenTest: (test: CreeveyTest) => void;
}>;
export interface SideBarProps {
    testId?: string;
    rootSuite: CreeveySuite;
    onOpenTest: (test: CreeveyTest) => void;
    filter: CreeveyViewFilter;
    setFilter: (filter: CreeveyViewFilter) => void;
}
export declare function SideBar({ rootSuite, testId, onOpenTest, filter, setFilter }: SideBarProps): JSX.Element;
