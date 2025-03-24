import React, { useContext } from 'react';
import { CreeveySuite, noop } from '../../types.js';

export type SuitePath = string[];
export type FocusableItem = null | SuitePath;

export interface CreeveyContextType {
  isReport: boolean;
  isRunning: boolean;
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

export const CreeveyContext = React.createContext<CreeveyContextType>({
  isReport: true,
  isRunning: false,
  onImageNext: noop,
  onImageApprove: noop,
  onApproveAll: noop,
  onStop: noop,
  onStart: noop,
  onSuiteOpen: noop,
  onSuiteToggle: noop,
  sidebarFocusedItem: [],
  setSidebarFocusedItem: noop,
});

export const useCreeveyContext = () => useContext(CreeveyContext);
