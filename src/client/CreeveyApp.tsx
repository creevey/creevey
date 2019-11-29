import React, { useEffect, useState } from 'react';
import { CreeveyUpdate, CreeveySuite, isDefined } from '../types';
import { CreeveyClientApi } from './creeveyClientApi';
import { useImmer } from 'use-immer';
import { CreeveyView } from './CreeveyView';
import { getCheckedTests, updateTestStatus, splitLastPathToken, toggleChecked } from './helpers';
import { CreeveyContex } from './CreeveyContext';

export interface CreeveyAppProps {
  api?: CreeveyClientApi;
  initialState: {
    tests: CreeveySuite;
    isRunning: boolean;
  };
}

export function CreeveyApp({ api, initialState }: CreeveyAppProps): JSX.Element {
  const [tests, updateTests] = useImmer(initialState.tests);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);

  // TODO unsubscribe
  useEffect(
    () =>
      api?.onUpdate(({ isRunning, tests }: CreeveyUpdate) => {
        if (isDefined(isRunning)) setIsRunning(isRunning);
        if (isDefined(tests))
          updateTests(draft => {
            Object.values(tests).forEach(
              test => test && updateTestStatus(draft, splitLastPathToken(test.path).reverse(), test),
            );
          });
      }),
    [api, updateTests],
  );

  const handleTestOrSuiteToggle = (path: string[], checked: boolean): void => {
    updateTests(draft => {
      toggleChecked(draft, path, checked);
    });
  };
  const handleImageApprove = (id: string, retry: number, image: string): void => {
    if (!api) return;
    api.approve(id, retry, image);
  };
  const handleStart = (tests: CreeveySuite): void => {
    if (!api) return;
    api.start(getCheckedTests(tests).map(test => test.id));
  };
  const handleStop = (): void => {
    if (!api) return;
    api.stop();
  };

  return (
    <CreeveyContex.Provider
      value={{
        isRunning,
        onStart: handleStart,
        onStop: handleStop,
        onImageApprove: handleImageApprove,
        onTestOrSuiteToggle: handleTestOrSuiteToggle,
      }}
    >
      <CreeveyView rootSuite={tests} />
    </CreeveyContex.Provider>
  );
}
