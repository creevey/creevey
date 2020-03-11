import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Loader } from '@skbkontur/react-ui';
import { CreeveyApp } from './CreeveyApp';

import './index.css';
import { initCreeveyClientApi, CreeveyClientApi } from './creeveyClientApi';
import { CreeveyStatus } from '../types';
import { treeifyTests } from './helpers';

declare global {
  const __CREEVEY_DATA__: CreeveyStatus['tests'];
}

function loadCreeveyData(): Promise<CreeveyStatus['tests']> {
  return new Promise<CreeveyStatus['tests']>(resolve => {
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
    creeveyApi = await initCreeveyClientApi();
    creeveyStatus = await creeveyApi.status;
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
  <Suspense fallback={<Loader active type="big" />}>
    <CreeveAppAsync />
  </Suspense>,
  document.getElementById('root'),
);
