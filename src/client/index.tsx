import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { CreeveyApp } from "./CreeveyApp";

import "./index.css";
import { initCreeveyClientApi, CreeveyClientApi } from "./creeveyClientApi";
import Loader from "@skbkontur/react-ui/Loader";
import { Test, CreeveyStatus } from "src/types";

declare global {
  const __CREEVEY_DATA__: Partial<{ [id: string]: Test }>;
}

function loadCreeveyData() {
  return new Promise<Partial<{ [id: string]: Test }>>(resolve => {
    const script = document.createElement("script");
    script.src = "data.js";
    script.onload = () => resolve(__CREEVEY_DATA__);
    document.body.appendChild(script);
  });
}

const CreeveAppAsync = React.lazy(async () => {
  let initialStatus: CreeveyStatus;
  let creeveyApi: CreeveyClientApi | undefined;
  if (window.location.host) {
    creeveyApi = await initCreeveyClientApi();
    initialStatus = await creeveyApi.status;
  } else {
    initialStatus = { isRunning: false, tests: await loadCreeveyData() };
  }

  return {
    default: () => <CreeveyApp api={creeveyApi} initialStatus={initialStatus} />
  };
});

ReactDOM.render(
  <Suspense fallback={<Loader active />}>
    <CreeveAppAsync />
  </Suspense>,
  document.getElementById("root")
);
