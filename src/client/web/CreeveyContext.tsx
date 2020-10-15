import React from 'react';
import { CreeveySuite, noop } from '../../types';

export interface CreeveyContextType {
  isRunning: boolean;
  onStop: () => void;
  onStart: (rootSuite: CreeveySuite) => void;
  onSuiteOpen: (path: string[], opened: boolean) => void;
  onSuiteToggle: (path: string[], checked: boolean) => void;
}

export const CreeveyContext = React.createContext<CreeveyContextType>({
  isRunning: false,
  onStop: noop,
  onStart: noop,
  onSuiteOpen: noop,
  onSuiteToggle: noop,
});
