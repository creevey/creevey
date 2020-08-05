import { API as StorybookAPI } from '@storybook/api';
import { DecoratorFunction } from '@storybook/addons';
import { IKey } from 'selenium-webdriver/lib/input';
import { Worker as ClusterWorker } from 'cluster';
import { WebDriver, WebElementPromise } from 'selenium-webdriver';
import Pixelmatch from 'pixelmatch';
import { Context } from 'mocha';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type DiffOptions = typeof Pixelmatch extends (
  x1: any,
  x2: any,
  x3: any,
  x4: any,
  x5: any,
  options?: infer T,
) => void
  ? T
  : never;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type SetStoriesData = {
  globalParameters: { creevey?: CreeveyStoryParams };
  kindParameters: Partial<{ [kind: string]: { fileName: string; creevey?: CreeveyStoryParams } }>;
  stories: StoriesRaw;
};

export type StoriesRaw = StorybookAPI extends { setStories: (stories: infer SS) => void } ? SS : never;

export type StoryInput = StoriesRaw extends { [id: string]: infer S } ? S : never;

export interface StoryMeta<StoryFnReturnType = unknown> {
  title: string;
  component?: unknown;
  decorators?: DecoratorFunction<StoryFnReturnType>[];
  parameters?: {
    creevey?: CreeveyStoryParams;
    [name: string]: unknown;
  };
}

export interface CSFStory<StoryFnReturnType = unknown> {
  (): StoryFnReturnType;
  /**
   * @deprecated
   * CSF .story annotations deprecated; annotate story functions directly:
   * - StoryFn.story.name => StoryFn.storyName
   * - StoryFn.story.(parameters|decorators) => StoryFn.(parameters|decorators)
   * See https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations for details and codemod.
   */
  story?: {
    name?: string;
    decorators?: DecoratorFunction<StoryFnReturnType>[];
    parameters?: {
      creevey?: CreeveyStoryParams;
      [name: string]: unknown;
    };
  };
  storyName?: string;
  decorators?: DecoratorFunction<StoryFnReturnType>[];
  parameters?: {
    creevey?: CreeveyStoryParams;
    [name: string]: unknown;
  };
}

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

export interface HookConfig {
  before?: () => unknown;
  after?: () => unknown;
}

export interface Config {
  /**
   * Url to Selenium grid hub or standalone selenium instance
   */
  gridUrl: string;
  /**
   * Url where storybook hosted on
   * @default http://localhost:6006
   */
  storybookUrl: string;
  /**
   * Absolute path to directory with reference images
   * @default path.join(process.cwd(), './images')
   */
  screenDir: string;
  /**
   * Absolute path where test reports and diff images would be saved
   * @default path.join(process.cwd(), './report')
   */
  reportDir: string;
  /**
   * Absolute path to storybook config directory
   * @default path.join(process.cwd(), './.storybook')
   */
  storybookDir: string;
  /**
   * How much test would be retried
   * @default 0
   */
  maxRetries: number;
  /**
   * Define pixelmatch diff options
   * @default { threshold: 0, includeAA: true }
   */
  diffOptions: DiffOptions;
  /**
   * Browser capabilities
   * @default { chrome: true }
   */
  browsers: { [key: string]: Browser };
  /**
   */
  hooks: HookConfig;
}

export type CreeveyConfig = Config | Partial<Omit<Config, 'gridUrl'>>;

export interface Options {
  config?: string;
  port: number;
  ui: boolean;
  update: boolean;
  webpack: boolean;
  debug: boolean;
  browser?: string;
  storybookBundle?: string;
  reporter?: string;
  gridUrl?: string;
  screenDir?: string;
  reportDir?: string;
  saveReport?: boolean;
}

export type TestWorkerMessage = { id: string; path: string[]; retries: number };

export type WebpackMessage =
  | { type: 'ready'; payload: { filePath: string } }
  | { type: 'failed' }
  | { type: 'rebuild started' }
  | { type: 'rebuild succeeded' }
  | { type: 'rebuild failed' };

export interface Worker extends ClusterWorker {
  isRunning?: boolean;
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

export type TestStatus = 'unknown' | 'pending' | 'running' | 'failed' | 'success';

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
  retries?: number;
  status?: TestStatus;
  results?: TestResult[];
  approved?: Partial<{ [image: string]: number }>;
}

export interface ServerTest extends Test {
  story: StoryInput;
  fn: (this: Context) => Promise<void>;
}

export interface CreeveyStatus {
  isRunning: boolean;
  tests: Partial<{ [id: string]: Test }>;
}

export interface CreeveyUpdate {
  isRunning?: boolean;
  tests?: Partial<{ [id: string]: Partial<Test> & { path: string[] } }>;
  removedTests?: string[][];
}

export interface SkipOption {
  reason?: string;
  in?: string | string[] | RegExp;
  kinds?: string | string[] | RegExp;
  stories?: string | string[] | RegExp;
  tests?: string | string[] | RegExp;
}

export type SkipOptions = string | SkipOption | SkipOption[];

export type CreeveyTestFunction = (this: {
  browser: WebDriver;
  keys: IKey;
  expect: Chai.ExpectStatic;
  takeScreenshot: () => Promise<string>;
  readonly captureElement?: WebElementPromise;
}) => Promise<void>;

export interface CreeveyStoryParams {
  captureElement?: string | null;
  delay?: number;
  skip?: SkipOptions;
  tests?: {
    // TODO Define browserName, story
    [name: string]: CreeveyTestFunction;
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
  children: Partial<{ [title: string]: CreeveySuite | CreeveyTest }>;
}

export type ImagesViewMode = 'side-by-side' | 'swap' | 'slide' | 'blend';

export function noop(): void {
  /* noop */
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isTest<T1, T2 extends Test>(x?: T1 | T2): x is T2 {
  return isDefined(x) && 'id' in x && 'path' in x && Array.isArray(x.path) && typeof x.id == 'string';
}

export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x == 'object' && x != null;
}

export function isString(x: unknown): x is string {
  return typeof x == 'string';
}
