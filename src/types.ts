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
  actual: string;
  expect?: string;
  diff?: string;
}

export type TestStatus = "unknown" | "pending" | "running" | "failed" | "success";

export interface TestResult {
  status: TestStatus;
  images?: Partial<{ [name: string]: Images }>;
}

export interface Test {
  id: string;
  path: string[];
  retries: number;
  skip?: boolean;
  results?: Partial<{ [retry: number]: TestResult }>;
}

export interface CreeveyStatus {
  isRunning: boolean;
  testsById: Partial<{ [id: string]: Test }>;
}

export interface TestUpdate extends TestResult {
  id: string;
  retry: number;
}

export type Request = { type: "status" } | { type: "start"; payload: string[] } | { type: "stop" };

export type Response =
  | { type: "status"; payload: CreeveyStatus }
  | { type: "start"; payload: string[] }
  | { type: "stop" }
  | { type: "test"; payload: TestUpdate };

export function isTest<T1, T2 extends Test>(x: T1 | T2): x is T2 {
  return (
    "id" in x &&
    "path" in x &&
    "retries" in x &&
    Array.isArray(x.path) &&
    typeof x.id == "string" &&
    typeof x.retries == "number"
  );
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
