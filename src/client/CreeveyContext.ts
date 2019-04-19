import React from "react";
import { Tests } from "../types";

export interface CreeveyContextType {
  isRunning: boolean;
  tests: Tests | null;
  start: () => void;
  stop: () => void;
  onTestToogle: (id: string, checked: boolean) => void;
}

function noop() {}

export const CreeveyContex = React.createContext<CreeveyContextType>({
  isRunning: false,
  tests: {},
  start: noop,
  stop: noop,
  onTestToogle: noop
});
