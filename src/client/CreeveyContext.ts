import React from "react";
import { Test as ApiTest, TestStatus } from "../types";

export interface Test extends ApiTest {
  checked: boolean;
}

export interface Suite {
  path: string[];
  status?: TestStatus;
  checked: boolean;
  indeterminate: boolean;
  children: { [title: string]: Suite | Test };
}

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
