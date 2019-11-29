import React from 'react';
import { CreeveySuite, noop } from '../types';

export interface CreeveyContextType {
  isRunning: boolean;
  onStop: () => void;
  onStart: (rootSuite: CreeveySuite) => void;
  onTestOrSuiteToggle: (path: string[], checked: boolean) => void;
  onImageApprove: (id: string, retry: number, image: string) => void;
}

export const CreeveyContex = React.createContext<CreeveyContextType>({
  isRunning: false,
  onStop: noop,
  onStart: noop,
  onTestOrSuiteToggle: noop,
  onImageApprove: noop,
});
