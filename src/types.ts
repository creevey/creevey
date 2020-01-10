import { API as StorybookAPI } from '@storybook/api';
import { Worker as ClusterWorker } from 'cluster';
import { Context } from 'mocha';
import Chai from 'chai';
import Selenium from 'selenium-webdriver';

export type StoriesRaw = StorybookAPI extends { setStories: (stories: infer SS) => void } ? SS : never;

export type StoryInput = StoriesRaw extends { [id: string]: infer S } ? S : never;

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
  storybookDir: string;
  maxRetries: number;
  threshold: number;
  browsers: { [key: string]: Browser };
}

export type CreeveyConfig = Config | Partial<Omit<Config, 'gridUrl'>>;

export interface Options {
  config: string;
  port: number;
  parser: boolean;
  ui: boolean;
  update: boolean;
  browser?: string;
  reporter?: string;
  gridUrl?: string;
  screenDir?: string;
  reportDir?: string;
}

export interface Worker extends ClusterWorker {
  isRunnning?: boolean;
}

export type WorkerMessage =
  | { type: 'ready' }
  | {
      type: 'error';
      payload: { status: 'failed'; error: string };
    }
  | {
      type: 'test';
      payload: TestResult;
    };

export interface Images {
  actual: string;
  expect?: string;
  diff?: string;
}

export type TestStatus = 'pending' | 'running' | 'failed' | 'success';

export interface TestResult {
  status: 'failed' | 'success';
  // TODO Remove checks `name == browser` in TestResultsView
  // images?: Partial<{ [name: string]: Images }> | Images;
  images?: Partial<{ [name: string]: Images }>;
  error?: string;
}

export interface Test {
  id: string;
  // NOTE example: [browser, test, story, kind],
  path: string[];
  skip: boolean | string;
  retries: number;
  status?: TestStatus;
  results?: TestResult[];
  approved?: Partial<{ [image: string]: number }>;
}

export interface CreeveyStatus {
  isRunning: boolean;
  tests: Partial<{ [id: string]: Test }>;
}

export interface CreeveyUpdate {
  isRunning?: boolean;
  tests?: Partial<{ [id: string]: Partial<Test> & { path: string[] } }>;
}

export interface SkipOption {
  reason?: string;
  in?: string | string[] | RegExp;
  kinds?: string | string[] | RegExp;
  stories?: string | string[] | RegExp;
  // TODO Implement
  // tests?: string | string[] | RegExp;
}

export type SkipOptions = string | SkipOption | SkipOption[];

export interface CreeveyStoryParams {
  captureElement?: string;
  skip?: SkipOptions;
  _seleniumTests?: (
    selenium: typeof Selenium,
    chai: typeof Chai,
  ) => {
    [name: string]: (this: Context) => Promise<void>;
  };
}

export type CreeveyStory = {
  id: string;
  name: string;
  kind: string;
  params?: CreeveyStoryParams;
};
export type CreeveyStories = Partial<{
  [id: string]: CreeveyStory;
}>;

export interface ApprovePayload {
  id: string;
  retry: number;
  image: string;
}

export type Request =
  | { type: 'status' }
  | { type: 'start'; payload: string[] }
  | { type: 'stop' }
  | { type: 'approve'; payload: ApprovePayload };

export type Response = { type: 'status'; payload: CreeveyStatus } | { type: 'update'; payload: CreeveyUpdate };

export interface CreeveyTest extends Test {
  checked: boolean;
}

export interface CreeveySuite {
  path: string[];
  skip: boolean;
  status?: TestStatus;
  opened: boolean;
  checked: boolean;
  indeterminate: boolean;
  children: { [title: string]: CreeveySuite | CreeveyTest };
}

export type ImagesViewMode = 'side-by-side' | 'swap' | 'slide' | 'blend';

export function noop(): void {
  /* noop */
}

export function isTest<T1, T2 extends Test>(x: T1 | T2): x is T2 {
  return 'id' in x && 'path' in x && 'retries' in x && Array.isArray(x.path) && typeof x.id == 'string';
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
