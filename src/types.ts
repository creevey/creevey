import type { StoryContextForEnhancers, DecoratorFunction } from '@storybook/csf';
import type { IKey } from 'selenium-webdriver/lib/input.js';
import type { Worker as ClusterWorker } from 'cluster';
import type { until, WebDriver, WebElementPromise } from 'selenium-webdriver';
import type Pixelmatch from 'pixelmatch';
import type { Context } from 'mocha';
import type { expect } from 'chai';

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

export interface SetStoriesData {
  v?: number;
  globalParameters: { creevey?: CreeveyStoryParams };
  kindParameters: Partial<Record<string, { fileName: string; creevey?: CreeveyStoryParams }>>;
  stories: StoriesRaw;
}

export type StoriesRaw = Record<string, StoryContextForEnhancers>;

export type StoryInput = StoriesRaw extends Record<string, infer S> ? S : never;

export interface StoryMeta {
  title: string;
  component?: unknown;
  decorators?: DecoratorFunction[];
  parameters?: {
    creevey?: CreeveyStoryParams;
    [name: string]: unknown;
  };
}

export interface CreeveyMeta {
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
    decorators?: DecoratorFunction[];
    parameters?: {
      creevey?: CreeveyStoryParams;
      [name: string]: unknown;
    };
  };

  storyName?: string;
  decorators?: DecoratorFunction[];
  parameters?: {
    creevey?: CreeveyStoryParams;
    [name: string]: unknown;
  };
}

export interface CreeveyStory {
  parameters?: {
    creevey?: CreeveyStoryParams;
    [name: string]: unknown;
  };
}

export interface Capabilities {
  browserName: string;
  browserVersion?: string;
  platformName?: string;
  /**
   * @deprecated use `browserVersion` instead
   */
  version?: string;
  [prop: string]: unknown;
}

export type BrowserConfig = Capabilities & {
  limit?: number;
  gridUrl?: string;
  storybookUrl?: string;
  /**
   * Storybook's globals to set in a specific browser
   * @see https://github.com/storybookjs/storybook/blob/v6.0.0/docs/essentials/toolbars-and-globals.md
   */
  _storybookGlobals?: StorybookGlobals;
  /**
   * Specify custom docker image. Used only with `useDocker == true`
   * @default `selenoid/${browserName}:${browserVersion ?? 'latest'}`
   */
  dockerImage?: string;
  /**
   * Command to start standalone webdriver
   * Used only with `useDocker == false`
   */
  webdriverCommand?: string[];
  viewport?: { width: number; height: number };
};

export type StorybookGlobals = Record<string, unknown>;

export type Browser = boolean | string | BrowserConfig;

export interface HookConfig {
  before?: () => unknown;
  after?: () => unknown;
}

export interface DockerAuth {
  key?: string;
  username?: string;
  password?: string;
  auth?: string;
  email?: string;
  serveraddress?: string;
}

export interface Config {
  /**
   * Url to Selenium grid hub or standalone selenium.
   * By default creevey will use docker containers
   */
  gridUrl: string;
  /**
   * Url where storybook hosted on
   * @default 'http://localhost:6006'
   */
  storybookUrl: string;
  /**
   * Url where storybook hosted on
   */
  resolveStorybookUrl?: () => Promise<string>;
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
  browsers: Record<string, Browser>;
  /**
   * Hooks that allow run custom script before and after creevey start
   */
  hooks: HookConfig;
  /**
   * Creevey automatically download latest selenoid binary. You can define path to different verison.
   * Works only with `useDocker == false`
   */
  selenoidPath?: string;
  /**
   * Creevey has two built-in stories providers.
   *
   * `nodejsStoriesProvider` - The first one is used by default except if CSFv3 is enabled in Storybook.
   * This provider builds and runs storybook in nodejs env, that allows write interaction tests by using Selenium API.
   * The downside is it depends from project build specific and slightly increases init time.
   *
   * `browserStoriesProvider` - The second one is used by default with CSFv3 storybook feature.
   * It load stories from storybook which is running in browser, like storyshots or loki do it.
   * The downside of this, you can't use interaction tests in Creevey, unless you use CSFv3.
   * Where you can define `play` method for each story
   *
   * Usage
   * ``` typescript
   * import { nodejsStoriesProvider as provider } from 'creevey'
   * // or
   * import { browserStoriesProvider as provider } from 'creevey'
   *
   * // Creevey config
   * module.exports = {
   *   storiesProvider: provider
   * }
   * ```
   */
  storiesProvider: StoriesProvider;
  /**
   * Define custom babel options for load stories transformation
   */
  babelOptions: (options: Record<string, unknown>) => Record<string, unknown>;
  /**
   * Allows you to start selenoid without docker
   * and use standalone browsers
   * @default true
   */
  useDocker: boolean;
  /**
   * Custom selenoid docker image
   * @default 'aerokube/selenoid:latest-release'
   */
  dockerImage: string;
  /**
   * Should Creevey pull docker images or use local ones
   * @default true
   */
  pullImages: boolean;
  /**
   * Define auth config for private docker registry
   */
  dockerAuth?: DockerAuth;
  /**
   * Enable to stop tests running right after the first failed test.
   * The `--ui` CLI option ignores this option
   */
  failFast: boolean;
  /**
   * Specify platform for docker images
   */
  dockerImagePlatform: string;
  testsRegex?: RegExp;
  testsDir?: string;
  tsConfig?: string;
  /**
   * Telemetry contains information about Creevey and Storybook versions, used Creevey config, browsers and tests meta.
   * It's being sent only for projects from git.skbkontur.ru
   * @default false
   */
  disableTelemetry?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StoriesProvider<T = any> {
  (config: Config, options: T, storiesListener: (stories: Map<string, StoryInput[]>) => void): Promise<StoriesRaw>;
  providerName?: string;
}

export type CreeveyConfig = Partial<Config>;

export interface Options {
  _: string[];
  config?: string;
  port: number;
  ui: boolean;
  update: boolean | string;
  debug: boolean;
  trace: boolean;
  tests: boolean;
  browser?: string;
  reporter?: string;
  screenDir?: string;
  reportDir?: string;
  storybookUrl?: string;
  saveReport: boolean;
  failFast?: boolean;
}

export type WorkerMessage = { type: 'ready'; payload?: never } | { type: 'error'; payload: { error: string } };

export type StoriesMessage =
  | { type: 'get'; payload?: never }
  | { type: 'set'; payload: { stories: StoriesRaw; oldTests: string[] } }
  | { type: 'update'; payload: [string, StoryInput[]][] }
  | { type: 'capture'; payload?: CaptureOptions };

export type TestMessage =
  | { type: 'start'; payload: { id: string; path: string[]; retries: number } }
  | { type: 'end'; payload: TestResult };

export type WebpackMessage =
  | { type: 'success'; payload?: never }
  | { type: 'fail'; payload?: never }
  | { type: 'rebuild succeeded'; payload?: never }
  | { type: 'rebuild failed'; payload?: never };

export type DockerMessage = { type: 'start'; payload?: never } | { type: 'success'; payload: { gridUrl: string } };

export type ShutdownMessage = object;

export type ProcessMessage =
  | (WorkerMessage & { scope: 'worker' })
  | (StoriesMessage & { scope: 'stories' })
  | (TestMessage & { scope: 'test' })
  | (WebpackMessage & { scope: 'webpack' })
  | (DockerMessage & { scope: 'docker' })
  | (ShutdownMessage & { scope: 'shutdown' });

export type WorkerHandler = (message: WorkerMessage) => void;
export type StoriesHandler = (message: StoriesMessage) => void;
export type TestHandler = (message: TestMessage) => void;
export type WebpackHandler = (message: WebpackMessage) => void;
export type DockerHandler = (message: DockerMessage) => void;
export type ShutdownHandler = (message: ShutdownMessage) => void;

export interface Worker extends ClusterWorker {
  isRunning?: boolean;
}

export interface Images {
  actual: string;
  expect?: string;
  diff?: string;
  error?: string;
}

export type TestStatus = 'unknown' | 'pending' | 'running' | 'failed' | 'approved' | 'success' | 'retrying';

export interface TestResult {
  status: 'failed' | 'success';
  // TODO Remove checks `name == browser` in TestResultsView
  // images?: Partial<{ [name: string]: Images }> | Images;
  images?: Partial<Record<string, Images>>;
  error?: string;
}

export interface ImagesError extends Error {
  images: string | Partial<Record<string, string>>;
}

export interface TestMeta {
  id: string;
  storyPath: string[];
  browser: string;
  testName?: string;
  storyId: string;
}

export interface TestData extends TestMeta {
  skip?: boolean | string;
  retries?: number;
  status?: TestStatus;
  results?: TestResult[];
  approved?: Partial<Record<string, number>>;
}

export interface ServerTest extends TestData {
  story: StoryInput;
  fn: (this: Context) => Promise<void>;
}

export interface CreeveyStatus {
  isRunning: boolean;
  tests: Partial<Record<string, TestData>>;
  browsers: string[];
}

export interface CreeveyUpdate {
  isRunning?: boolean;
  // TODO Use Map instead
  tests?: Partial<Record<string, TestData>>;
  removedTests?: TestMeta[];
}

export interface SkipOption {
  in?: string | string[] | RegExp;
  kinds?: string | string[] | RegExp;
  stories?: string | string[] | RegExp;
  tests?: string | string[] | RegExp;
}

export type SkipOptions = boolean | string | Record<string, SkipOption | SkipOption[]>;

export interface CreeveyTestController {
  browser: WebDriver;
  until: typeof until;
  keys: IKey;
  expect: typeof expect;
  takeScreenshot: () => Promise<string>;
  updateStoryArgs: (updatedArgs: Record<string, unknown>) => Promise<void>;
  readonly captureElement?: WebElementPromise;
}

export type CreeveyTestFunction = (this: CreeveyTestController) => Promise<void>;

export interface CaptureOptions {
  imageName?: string;
  captureElement?: string | null;
  ignoreElements?: string | string[] | null;
}

export interface CreeveyStoryParams extends CaptureOptions {
  waitForReady?: boolean;
  delay?: number | { for: string[]; ms: number };
  skip?: SkipOptions;
  tests?: Record<string, CreeveyTestFunction>;
}

export interface ApprovePayload {
  id: string;
  retry: number;
  image: string;
}

export type Request =
  | { type: 'status' }
  | { type: 'start'; payload: string[] }
  | { type: 'stop' }
  | { type: 'approve'; payload: ApprovePayload }
  | { type: 'approveAll' };

export type Response =
  | { type: 'status'; payload: CreeveyStatus }
  | { type: 'update'; payload: CreeveyUpdate }
  | { type: 'capture' };

export interface CreeveyTest extends TestData {
  checked: boolean;
}

export interface CreeveySuite {
  path: string[];
  skip: boolean;
  status?: TestStatus;
  opened: boolean;
  checked: boolean;
  indeterminate: boolean;
  // TODO Use Map instead
  children: Partial<Record<string, CreeveySuite | CreeveyTest>>;
}

export type ImagesViewMode = 'side-by-side' | 'swap' | 'slide' | 'blend';

export function noop(): void {
  /* noop */
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isTest(x?: CreeveySuite | CreeveyTest): x is CreeveyTest {
  return (
    isDefined(x) &&
    isObject(x) &&
    'id' in x &&
    'storyId' in x &&
    typeof x.id == 'string' &&
    typeof x.storyId == 'string'
  );
}

export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x == 'object' && x != null;
}

export function isString(x: unknown): x is string {
  return typeof x == 'string';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(x: unknown): x is (...args: any[]) => any {
  return typeof x == 'function';
}

export function isImageError(error: unknown): error is ImagesError {
  return error instanceof Error && 'images' in error;
}

export function isProcessMessage(message: unknown): message is ProcessMessage {
  return isObject(message) && 'scope' in message;
}

export function isWorkerMessage(message: unknown): message is WorkerMessage {
  return isProcessMessage(message) && message.scope == 'worker';
}

export function isStoriesMessage(message: unknown): message is StoriesMessage {
  return isProcessMessage(message) && message.scope == 'stories';
}

export function isTestMessage(message: unknown): message is TestMessage {
  return isProcessMessage(message) && message.scope == 'test';
}

export function isWebpackMessage(message: unknown): message is WebpackMessage {
  return isProcessMessage(message) && message.scope == 'webpack';
}

export function isDockerMessage(message: unknown): message is DockerMessage {
  return isProcessMessage(message) && message.scope == 'docker';
}
