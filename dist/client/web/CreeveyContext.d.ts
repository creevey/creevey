import React from 'react';
import { CreeveySuite } from '../../types.js';
export type SuitePath = string[];
export type FocusableItem = null | SuitePath;
export interface CreeveyContextType {
    isReport: boolean;
    isRunning: boolean;
    isUpdateMode: boolean;
    onStop: () => void;
    onImageNext?: () => void;
    onImageApprove?: () => void;
    onApproveAll: () => void;
    onStart: (rootSuite: CreeveySuite) => void;
    onSuiteOpen: (path: string[], opened: boolean) => void;
    onSuiteToggle: (path: string[], checked: boolean) => void;
    sidebarFocusedItem: FocusableItem;
    setSidebarFocusedItem: (item: FocusableItem) => void;
}
export declare const CreeveyContext: React.Context<CreeveyContextType>;
export declare const useCreeveyContext: () => CreeveyContextType;
