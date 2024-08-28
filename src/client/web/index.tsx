import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { CreeveyApp } from './CreeveyApp.js';

import { initCreeveyClientApi, CreeveyClientApi } from '../shared/creeveyClientApi.js';
import { CreeveyStatus, noop } from '../../types.js';
import { treeifyTests } from '../shared/helpers.js';
import { CreeveyLoader } from './CreeveyLoader.js';

declare global {
  const __CREEVEY_DATA__: CreeveyStatus['tests'];
}

window.__CREEVEY_SET_READY_FOR_CAPTURE__ = noop;

function loadCreeveyData(): Promise<CreeveyStatus['tests']> {
  return new Promise<CreeveyStatus['tests']>((resolve) => {
    const script = document.createElement('script');
    script.src = 'data.js';
    script.onload = () => {
      resolve(__CREEVEY_DATA__);
    };
    document.body.appendChild(script);
  });
}

const CreeveyAppAsync = React.lazy(async () => {
  let isReport = false;
  let creeveyStatus: CreeveyStatus;
  let creeveyApi: CreeveyClientApi | undefined;
  if (window.location.host) {
    try {
      creeveyApi = await initCreeveyClientApi();
      creeveyStatus = await creeveyApi.status;
    } catch (error) {
      // NOTE: Failed to get status from API
      // NOTE: It might happen on circle ci from artifact
      isReport = true;
      creeveyStatus = { isRunning: false, tests: await loadCreeveyData(), browsers: [] };
    }
  } else {
    isReport = true;
    creeveyStatus = { isRunning: false, tests: await loadCreeveyData(), browsers: [] };
  }

  return {
    default() {
      return (
        <CreeveyApp
          api={creeveyApi}
          initialState={{ isReport, isRunning: creeveyStatus.isRunning, tests: treeifyTests(creeveyStatus.tests) }}
        />
      );
    },
  };
});

ReactDOM.render(
  <Suspense fallback={<CreeveyLoader />}>
    <CreeveyAppAsync />
  </Suspense>,
  document.getElementById('root'),
);
