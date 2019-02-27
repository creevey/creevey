import { Worker as ClusterWorker } from "cluster";

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
  maxRetries: number;
  browsers: { [key: string]: Capabilities & BrowserConfig };
}

export interface Worker extends ClusterWorker {
  isRunnning?: boolean;
}

export interface Workers {
  [browser: string]: Worker[];
}

export interface Test {
  id: string;
  suites: string[];
  title: string;
  skip?: string[];
}

// TODO payload types
export type Command = { type: "getTests" } | { type: "start"; payload: string[] } | { type: "stop" };
