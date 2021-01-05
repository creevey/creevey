import React from 'react';
import { noop } from '../../types';

export interface CreeveyContextType {
  isRunning: boolean;
  onStop: () => void;
  onStart: (ids: string[]) => void;
  onStartStoryTests: () => void;
  onStartAllTests: () => void;
  onImageApprove: (id: string, retry: number, image: string) => void;
}

export const CreeveyContext = React.createContext<CreeveyContextType>({
  isRunning: false,
  onStop: noop,
  onStart: noop,
  onStartStoryTests: noop,
  onStartAllTests: noop,
  onImageApprove: noop,
});
