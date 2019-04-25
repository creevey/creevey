import { Worker as ClusterWorker } from "cluster";
import { Context } from "mocha";

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
  hooks: {
    beforeAll: (this: Context) => void;
    beforeEach: (this: Context) => void;
  };
}

export interface Worker extends ClusterWorker {
  isRunnning?: boolean;
}

export interface Workers {
  [browser: string]: Worker[];
}

export interface Images {
  [name: string]: {
    expected: string;
    diff?: string;
    actual?: string;
  };
}

export type TestStatus = "unknown" | "pending" | "failed" | "success";

export interface Test {
  id: string;
  path: string[];
  retries: number;
  skip?: boolean;
  result?: {
    [retry: number]: {
      status: TestStatus;
      images?: Images;
    };
  };
}

/**
 * {
 *   Button: {        // suite
 *     playground: {  // suite
 *       idle: {      // test
 *         chrome: {  // browser
 *           id: uuid,
 *           path: [Button, palyground, idle, chrome],
 *           result?: {
 *             retry: {
 *               status: enum,
 *               iamges?: {
 *                 idle: {  // image name
 *                   expected: string,
 *                   diff?: string,
 *                   actual?: string,
 *                 }
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export interface Tests {
  [title: string]: Tests | Test;
}

export interface CreeveyStatus {
  isRunning: boolean;
  tests: Tests;
}

export interface TestUpdate {
  path: string[];
  retry: number;
  status: TestStatus;
  images?: Images;
}

export type Request = { type: "status" } | { type: "start"; payload: string[] } | { type: "stop" };

export type Response = { type: "status"; payload: CreeveyStatus } | { type: "test"; payload: TestUpdate };

export function isTest<T1, T2 extends { id: string; path: string[]; retries: number }>(x: T1 | T2): x is T2 {
  return (
    "id" in x &&
    "path" in x &&
    "retries" in x &&
    Array.isArray(x.path) &&
    typeof x.id == "string" &&
    typeof x.retries == "number"
  );
}
