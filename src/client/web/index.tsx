import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Loader } from '@storybook/components';
import { CreeveyApp } from './CreeveyApp';

import { initCreeveyClientApi, CreeveyClientApi } from '../shared/creeveyClientApi';
import { CreeveyStatus } from '../../types';
import { treeifyTests } from '../shared/helpers';

declare global {
  const __CREEVEY_DATA__: CreeveyStatus['tests'];
}

function loadCreeveyData(): Promise<CreeveyStatus['tests']> {
  return new Promise<CreeveyStatus['tests']>((resolve) => {
    const script = document.createElement('script');
    script.src = 'data.js';
    script.onload = () => resolve(__CREEVEY_DATA__);
    document.body.appendChild(script);
  });
}

const CreeveAppAsync = React.lazy(async () => {
  let creeveyStatus: CreeveyStatus;
  let creeveyApi: CreeveyClientApi | undefined;
  if (window.location.host) {
    try {
      creeveyApi = await initCreeveyClientApi();
      creeveyStatus = await creeveyApi.status;
    } catch (error) {
      // NOTE: Failed to get status from API
      // NOTE: It might happen on circle ci from artifact
      creeveyStatus = { isRunning: false, tests: await loadCreeveyData() };
    }
  } else {
    creeveyStatus = { isRunning: false, tests: await loadCreeveyData() };
  }

  return {
    default() {
      return (
        <CreeveyApp
          api={creeveyApi}
          initialState={{ isRunning: creeveyStatus.isRunning, tests: treeifyTests(creeveyStatus.tests) }}
        />
      );
    },
  };
});

ReactDOM.render(
  <Suspense fallback={<Loader size={64} />}>
    <CreeveAppAsync />
  </Suspense>,
  document.getElementById('root'),
);
