import * as v from 'valibot';
import type { Worker as ClusterWorker } from 'cluster';
import type { expect } from 'chai';
import type EventEmitter from 'events';
import type { ODiffOptions } from 'odiff-bin';
import type { LaunchOptions } from 'playwright-core';
import type { PixelmatchOptions } from 'pixelmatch';
import type { StoryContextForEnhancers, DecoratorFunction } from 'storybook/internal/types';

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

export enum StorybookEvents {
  SET_STORIES = 'setStories',
  SET_CURRENT_STORY = 'setCurrentStory',
  FORCE_REMOUNT = 'forceRemount',
  STORY_RENDERED = 'storyRendered',
  STORY_ERRORED = 'storyErrored',
  STORY_THREW_EXCEPTION = 'storyThrewException',
  UPDATE_STORY_ARGS = 'updateStoryArgs',
  SET_GLOBALS = 'setGlobals',
  UPDATE_GLOBALS = 'updateGlobals',
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

// TODO Rework browser config
/*
export class ChromeConfig {
  browserName: 'chrome'

  constructor({ limit, version, ... })
}
*/
export interface BrowserConfigObject {
  // TODO Restrict browser names for playwright images
  browserName: string;
  // customizeBuilder?: (builder: Builder) => Builder;
  limit?: number;
  /**
   * Selenium grid url
   * @default config.gridUrl
   */
  gridUrl?: string;
  storybookUrl?: string;
  /**
   * Storybook's globals to set in a specific browser
   * @see https://github.com/storybookjs/storybook/blob/v6.0.0/docs/essentials/toolbars-and-globals.md
   */
  storybookGlobals?: StorybookGlobals;
  /**
   * @deprecated Use `storybookGlobals` instead
   */
  _storybookGlobals?: StorybookGlobals;
  /**
   * Specify custom docker image. Used only with `useDocker == true`
   * @default `selenoid/${browserName}:${browserVersion ?? 'latest'}` or `mcr.microsoft.com/playwright:${playwrightVersion}`
   */
  dockerImage?: string;
  /**
   * Command to start standalone webdriver
   * Used only with `useDocker == false`
   */
  webdriverCommand?: string[];
  // /**
  //  * Use to start standalone playwright browser
  //  */
  // playwrightBrowser?: () => Promise<Browser>;
  viewport?: { width: number; height: number };

  seleniumCapabilities?: {
    /**
     * Browser version. Ignored with Playwright webdriver
     */
    browserVersion?: string;
    /**
     * Operation system name. Ignored with Playwright webdriver
     */
    platformName?: string;
    [name: string]: unknown;
  };

  playwrightOptions?: Omit<LaunchOptions, 'logger'> & {
    trace?: {
      screenshots?: boolean;
      snapshots?: boolean;
      sources?: boolean;
    };
  };
}

export type StorybookGlobals = Record<string, unknown>;

export type BrowserConfig = boolean | string | BrowserConfigObject;

export type CreeveyWebdriverConstructor = new (
  browser: string,
  gridUrl: string,
  config: Config,
  options: WorkerOptions,
) => CreeveyWebdriver;

export interface CreeveyWebdriver {
  getSessionId(): Promise<string>;
  openBrowser(fresh?: boolean): Promise<CreeveyWebdriver | null>;
  closeBrowser(): Promise<void>;
  loadStoriesFromBrowser(): Promise<StoriesRaw>;
  switchStory(story: StoryInput, context: BaseCreeveyTestContext): Promise<CreeveyTestContext>;
  afterTest(test: ServerTest): Promise<void>;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaseReporter = new (runner: EventEmitter, options: { reportDir: string; reporterOptions: any }) => void;

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
   * Command to automatically start Storybook if it is not running.
   * For example, `npm run storybook` or `yarn storybook` etc.
   */
  storybookAutorunCmd?: string;
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
   * Specify a custom reporter for test results. Creevey accepts only mocha-like reporters
   * @optional
   * @default 'creevey'
   */
  reporter: BaseReporter | 'creevey' | 'teamcity' | 'junit';
  /**
   * Options which are used by reporter
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reporterOptions?: Record<string, any>;
  /**
   * How much test would be retried
   * @default 0
   */
  maxRetries: number;
  /**
   * How much time should be spent on each test
   * @default 30000
   */
  testTimeout: number;
  /**
   * Define pixelmatch diff options
   * @default { threshold: 0.1, includeAA: false }
   */
  diffOptions: PixelmatchOptions;
  /**
   * Define odiff diff options
   * @default { threshold: 0.1, antialiasing: true }
   */
  odiffOptions: ODiffOptions;
  /**
   * Browser capabilities
   * @default { chrome: true }
   */
  browsers: Record<string, BrowserConfig>;
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
   * `browserStoriesProvider` - Extracts stories directly from the Storybook UI. It loads stories from storybook which is running in browser, like storyshots or loki do it.
   * The downside of this, you can't use interaction tests in Creevey, unless you use CSFv3.
   * Where you can define `play` method for each story
   *
   * `hybridStoriesProvider` - Combines stories from Storybook with tests from separate files. This is the default provider used in the configuration.
   *
   * Usage
   * ``` typescript
   * import { browserStoriesProvider as provider } from 'creevey'
   * // or
   * import { hybridStoriesProvider as provider } from 'creevey'
   *
   * // Creevey config
   * module.exports = {
   *   storiesProvider: provider
   * }
   * ```
   */
  storiesProvider: StoriesProvider; // TODO Update description
  /**
   *
   */
  webdriver: CreeveyWebdriverConstructor; // TODO Update description
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
   * Start workers in sequential queue
   * @default false
   */
  useWorkerQueue: boolean;
  /**
   * Specify platform for docker images
   */
  dockerImagePlatform: string;
  testsRegex?: RegExp;
  testsDir?: string;
  /**
   * Telemetry contains information about Creevey and Storybook versions, used Creevey config, browsers and tests meta.
   * It's being sent only for projects from git.skbkontur.ru
   * @default false
   */
  disableTelemetry?: boolean;

  /**
   * Define a host where is creevey-server hosting.
   * It can be used for networks behind NAT
   */

  host?: string;
}

export interface StoriesProvider {
  (
    config: Config,
    storiesListener: (stories: Map<string, StoryInput[]>) => void,
    webdriver?: CreeveyWebdriver,
  ): Promise<StoriesRaw>;
  providerName?: string;
}

export type CreeveyConfig = Partial<Config>;

export const OptionsSchema = v.object({
  ui: v.optional(v.boolean()),
  storybookStart: v.optional(v.union([v.string(), v.boolean()])),
  config: v.optional(v.string()),
  debug: v.optional(v.boolean()),
  port: v.number(),
  failFast: v.optional(v.boolean()),
  reportDir: v.optional(v.string()),
  screenDir: v.optional(v.string()),
  storybookUrl: v.optional(v.string()),
  storybookPort: v.optional(v.number()),
  reporter: v.optional(v.string()),
  odiff: v.optional(v.boolean()),
  trace: v.optional(v.boolean()),
  docker: v.optional(v.boolean()),
});

export const WorkerOptionsSchema = v.object({
  browser: v.string(),
  storybookUrl: v.string(),
  gridUrl: v.optional(v.string()),
  config: v.optional(v.string()),
  debug: v.optional(v.boolean()),
  trace: v.optional(v.boolean()),
  reportDir: v.optional(v.string()),
  screenDir: v.optional(v.string()),
  odiff: v.optional(v.boolean()),
  port: v.number(),
});

export type Options = v.InferOutput<typeof OptionsSchema>;
export type WorkerOptions = v.InferOutput<typeof WorkerOptionsSchema>;

export type WorkerError = 'browser' | 'test' | 'unknown';

export type WorkerMessage =
  | { type: 'ready'; payload?: never }
  | { type: 'port'; payload: { port: number } }
  | { type: 'error'; payload: { subtype: WorkerError; error: string } };

export type StoriesMessage =
  | { type: 'get'; payload?: never }
  | { type: 'set'; payload: { stories: StoriesRaw; oldTests: string[] } }
  | { type: 'update'; payload: [string, StoryInput[]][] }
  | { type: 'capture'; payload?: CaptureOptions };

export type TestMessage =
  | { type: 'start'; payload: { id: string; path: string[]; retries: number } }
  | { type: 'end'; payload: TestResult };

export type ShutdownMessage = object;

export type ProcessMessage =
  | (WorkerMessage & { scope: 'worker' })
  | (StoriesMessage & { scope: 'stories' })
  | (TestMessage & { scope: 'test' })
  | (ShutdownMessage & { scope: 'shutdown' });

export type WorkerHandler = (message: WorkerMessage) => void;
export type StoriesHandler = (message: StoriesMessage) => void;
export type TestHandler = (message: TestMessage) => void;
export type ShutdownHandler = (message: ShutdownMessage) => void;

export interface Worker extends ClusterWorker {
  isRunning?: boolean;
  isShuttingDown?: boolean;
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
  retries: number;
  // TODO Remove checks `name == browser` in TestResultsView
  // images?: Partial<{ [name: string]: Images }> | Images;
  images?: Partial<Record<string, Images>>;
  error?: string;
  // Test metadata for reporting
  duration?: number;
  attachments?: string[];
  sessionId?: string;
  browserName?: string;
  workerId?: number;
}

export class ImagesError extends Error {
  images?: string | Partial<Record<string, string>>;
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
  approved?: Partial<Record<string, number>> | null;
}

export interface BaseCreeveyTestContext {
  browserName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webdriver: any;
  /**
   * @deprecated Usually for screenshot testing you don't need other type of assertions except matching images, but if you really need it, please use external `expect` libs
   */
  expect: typeof expect;
  /**
   * @internal
   */
  screenshots: { imageName?: string; screenshot: Buffer }[];
  matchImage: (image: Buffer | string, imageName?: string) => Promise<void>;
  matchImages: (images: Record<string, Buffer | string>) => Promise<void>;
}

export interface CreeveyTestContext extends BaseCreeveyTestContext {
  takeScreenshot: () => Promise<Buffer>;
  updateStoryArgs: (updatedArgs: Record<string, unknown>) => Promise<void>;
  captureElement: string | null;
}

export enum TEST_EVENTS {
  RUN_BEGIN = 'start',
  RUN_END = 'end',
  SUITE_BEGIN = 'suite',
  SUITE_END = 'suite end',
  TEST_BEGIN = 'test',
  TEST_END = 'test end',
  TEST_FAIL = 'fail',
  TEST_PASS = 'pass',
}

export interface ServerTest extends TestData {
  story: StoryInput;
  fn: CreeveyTestFunction;
}

export interface FakeSuite {
  title: string;
  fullTitle: () => string;
  titlePath: () => string[];
  tests: FakeTest[];
}

// NOTE: Mocha-like test interface, used specifically for reporting
export interface FakeTest {
  parent: FakeSuite;
  title: string;
  fullTitle: () => string;
  titlePath: () => string[];
  currentRetry: () => number | undefined;
  retires: () => number;
  slow: () => number;
  duration?: number;
  state?: 'failed' | 'passed';
  // NOTE > duration, > duration / 2, > 0
  speed?: 'slow' | 'medium' | 'fast';
  err?: string;
  // NOTE: image files
  attachments?: string[];

  // NOTE: Creevey specific fields
  creevey: {
    sessionId: string;
    browserName: string;
    workerId: number;
    willRetry: boolean;
    images: Partial<Record<string, Partial<Images>>>;
  };
}

export interface CreeveyStatus {
  isRunning: boolean;
  tests: Partial<Record<string, TestData>>;
  browsers: string[];
  isUpdateMode: boolean;
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

export type CreeveyTestFunction = (context: CreeveyTestContext) => Promise<void>;

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
  return error instanceof ImagesError && 'images' in error;
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
