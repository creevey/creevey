import React from "react";

export interface CreeveyContextType {
  onTestResultsOpen: (path: string[]) => void;
  onTestToogle: (path: string[], checked: boolean) => void;
  onImageApprove: (id: string, retry: number, image: string) => void;
}

function noop() {}

export const CreeveyContex = React.createContext<CreeveyContextType>({
  onTestResultsOpen: noop,
  onTestToogle: noop,
  onImageApprove: noop
});
