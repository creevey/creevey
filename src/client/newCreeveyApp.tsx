// import React, { useEffect } from "react";
// import { CreeveyStatus, Response } from "../types";
// import { CreeveyClientApi } from "./creeveyClientApi";
// import { useImmer } from "use-immer";

// export interface CreeveyAppProps {
//   api?: CreeveyClientApi;
//   initialStatus: CreeveyStatus;
// }

// interface CreeveyAppState {
//   tests: Suite | null;
//   isRunning: boolean;
//   openedTestPath: string[] | null;
// }

// export function CreeveyApp({ api, initialStatus }: CreeveyAppProps) {
//   const [state, updateState] = useImmer(initialStatus);

//   if (api) {
//     const handleUpdate = (data: Response) =>
//       updateState(draft => {
//         draft.isRunning = true;
//       });

//     useEffect(() => api.onUpdate(handleUpdate), []);
//   }

//   return <div />;
// }

// function CreeveyAppView() {}
