import { Worker } from "cluster";

export interface Capabilities {
  browserName: string;
}

export interface BrowserConfig {
  limit: number;
}

export interface Config {
  gridUrl: string;
  address: {
    host: string;
    port: number;
    path: string;
  };
  testDir: string;
  screenDir: string;
  reportDir: string;
  browsers: { [key: string]: Capabilities & BrowserConfig };
}

export interface Workers {
  [browser: string]: Array<Worker & { isRunning?: boolean }>;
}

export interface Tests {
  [kind: string]: { [story: string]: Array<{ test: string; skip?: string[] }> };
}

// TODO payload types
export type Command = { type: "getTests" } | { type: "start"; payload: Tests[] } | { type: "stop" };
