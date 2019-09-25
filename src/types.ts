import { API as StorybookAPI } from "@storybook/api";
import { Worker as ClusterWorker } from "cluster";
import { Context } from "mocha";

export type StoriesRaw = StorybookAPI extends { setStories: (stories: infer T) => void } ? T : never;

export interface Capabilities {
  browserName: string;
}

export type BrowserConfig = Capabilities & {
  limit?: number;
  gridUrl?: string;
  storybookUrl?: string;
  testRegex?: RegExp;
  viewport?: { width: number; height: number };
};

export type Browser = boolean | string | BrowserConfig;

export interface Config {
  gridUrl: string;
  storybookUrl: string;
  testRegex: RegExp;
  testDir?: string;
  screenDir: string;
  reportDir: string;
  maxRetries: number;
  threshold: number;
  browsers: { [key: string]: Browser };
  hooks?: {
    beforeAll: (this: Context) => void;
    beforeEach: (this: Context) => void;
  };
}

export type CreeveyConfig = Config | Partial<Omit<Config, "gridUrl">>;

export interface Options {
  config: string;
  port: number;
  parser: boolean;
  ui: boolean;
  update: boolean;
  browser?: string;
  reporter?: string;
  gridUrl?: string;
}

export interface Worker extends ClusterWorker {
  isRunnning?: boolean;
}

export type WorkerMessage =
  | {
      type: "ready";
      payload: { stories: StoriesRaw };
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
  // example: [browser, test, story, kind],
  path: string[];
  skip: boolean;
  retries: number;
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

interface SkipParameter {
  reason?: string;
  in?: string | string[] | RegExp;
  stories?: string | string[] | RegExp;
}

export interface WithCreeveyParameters {
  captureElement?: string;
  skip?: string | SkipParameter | SkipParameter[];
  // TODO actions/tests
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

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
