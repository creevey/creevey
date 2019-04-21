import React from "react";
import { Test as ApiTest } from "../types";

export interface Test extends ApiTest {
  checked: boolean;
}

export interface Tests {
  checked: boolean;
  indeterminate: boolean;
  children: { [title: string]: Tests | Test };
}

export interface CreeveyContextType {
  isRunning: boolean;
  tests: Tests | null;
  start: () => void;
  stop: () => void;
  onTestToogle: (path: string[], checked: boolean) => void;
}

function noop() {}

export const CreeveyContex = React.createContext<CreeveyContextType>({
  isRunning: false,
  tests: null,
  start: noop,
  stop: noop,
  onTestToogle: noop
});
