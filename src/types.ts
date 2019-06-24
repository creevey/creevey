import { Worker as ClusterWorker } from "cluster";
import { Context } from "mocha";

export interface Capabilities {
  browserName: string;
}

export interface BrowserConfig {
  limit: number;
  gridUrl?: string;
  address?: Address;
  testRegex?: RegExp;
}

interface Address {
  host: string;
  port: number;
  path: string;
}

export interface Config {
  gridUrl: string;
  address: Address;
  testRegex: RegExp;
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

export interface Options {
  config: string;
  parser: boolean;
  ui: boolean;
  browser?: string;
  reporter?: string;
}

export interface Worker extends ClusterWorker {
  isRunnning?: boolean;
}

export type WorkerMessage =
  | {
      type: "ready";
    }
  | {
      type: "error";
      payload: any;
    }
  | {
      type: "test";
      payload: TestResult;
    };

export interface Images {
  actual: string;
  expect?: string;
  diff?: string;
}

export type TestStatus = "pending" | "running" | "failed" | "success";

export interface TestResult {
  status: "failed" | "success";
  images?: Partial<{ [name: string]: Images }>;
  error?: string;
}

export interface Test {
  id: string;
  path: string[];
  skip: boolean;
  status?: TestStatus;
  results?: TestResult[];
  approved?: Partial<{ [image: string]: number }>;
}

export interface CreeveyStatus {
  isRunning: boolean;
  testsById: Partial<{ [id: string]: Test }>;
}

export interface CreeveyUpdate {
  isRunning?: boolean;
  testsById?: Partial<{ [id: string]: Partial<Test> }>;
}

export interface ApprovePayload {
  id: string;
  retry: number;
  image: string;
}

export type Request =
  | { type: "start"; payload: string[] }
  | { type: "stop" }
  | { type: "approve"; payload: ApprovePayload };

export type Response =
  | { type: "status"; seq: number; payload: CreeveyStatus }
  | { type: "update"; seq: number; payload: CreeveyUpdate };

export function isTest<T1, T2 extends Test>(x: T1 | T2): x is T2 {
  return "id" in x && "path" in x && "retries" in x && Array.isArray(x.path) && typeof x.id == "string";
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
