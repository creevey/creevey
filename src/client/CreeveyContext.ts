import React from "react";
import { Test as ApiTest, TestStatus } from "../types";

export interface Test extends ApiTest {
  checked: boolean;
}

export interface Tests {
  path: string[];
  status: TestStatus;
  checked: boolean;
  indeterminate: boolean;
  children: { [title: string]: Tests | Test };
}

export interface CreeveyContextType {
  onTestToogle: (path: string[], checked: boolean) => void;
}

function noop() {}

export const CreeveyContex = React.createContext<CreeveyContextType>({ onTestToogle: noop });
