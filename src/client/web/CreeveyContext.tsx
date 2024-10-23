import React, { useContext } from 'react';
import { CreeveySuite, noop } from '../../types.js';

export interface CreeveyContextType {
  isReport: boolean;
  isRunning: boolean;
  onStop: () => void;
  onImageApprove?: () => void;
  onApproveAll: () => void;
  onStart: (rootSuite: CreeveySuite) => void;
  onSuiteOpen: (path: string[], opened: boolean) => void;
  onSuiteToggle: (path: string[], checked: boolean) => void;
}

export const CreeveyContext = React.createContext<CreeveyContextType>({
  isReport: true,
  isRunning: false,
  onImageApprove: noop,
  onApproveAll: noop,
  onStop: noop,
  onStart: noop,
  onSuiteOpen: noop,
  onSuiteToggle: noop,
});

export const useCreeveyContext = () => useContext(CreeveyContext);
