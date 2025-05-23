# SYSTEM PATTERNS: CREEVEY

## ARCHITECTURAL PATTERNS

### MASTER-WORKER ARCHITECTURE

Creevey employs a distributed master-worker pattern for scalable test execution:

```typescript
// Master Process Responsibilities
- Test discovery and scheduling
- Worker lifecycle management
- Result aggregation and reporting
- WebSocket communication with UI clients
- Configuration management

// Worker Process Responsibilities
- Individual test execution
- Browser instance management
- Screenshot capture and comparison
- Result reporting to master
```

#### Worker Pool Management

```typescript
interface Worker extends ClusterWorker {
  isRunning?: boolean;
  isShuttingDown?: boolean;
}

// Dynamic worker scaling based on test load
const workerPool = new Map<string, Worker>();
const maxWorkers = config.browsers.length * 2;
```

### MESSAGE-PASSING SYSTEM

Inter-process communication uses strongly-typed message patterns:

```typescript
// Scope-based message routing
type ProcessMessage =
  | (WorkerMessage & { scope: 'worker' })
  | (StoriesMessage & { scope: 'stories' })
  | (TestMessage & { scope: 'test' })
  | (ShutdownMessage & { scope: 'shutdown' });

// Type-safe message handlers
type WorkerHandler = (message: WorkerMessage) => void;
type StoriesHandler = (message: StoriesMessage) => void;
```

### PROVIDER PATTERN

Extensible browser automation through provider abstraction:

```typescript
interface CreeveyWebdriver {
  getSessionId(): Promise<string>;
  openBrowser(fresh?: boolean): Promise<CreeveyWebdriver | null>;
  closeBrowser(): Promise<void>;
  loadStoriesFromBrowser(): Promise<StoriesRaw>;
  switchStory(story: StoryInput, context: BaseCreeveyTestContext): Promise<CreeveyTestContext>;
  afterTest(test: ServerTest): Promise<void>;
}

// Multiple provider implementations
- PlaywrightProvider: Modern browser automation
- SeleniumProvider: Legacy and grid support
- DockerProvider: Containerized environments
- LocalProvider: Direct browser instances
```

## DATA FLOW PATTERNS

### STORY DISCOVERY FLOW

```typescript
interface StoriesProvider {
  (
    config: Config,
    storiesListener: (stories: Map<string, StoryInput[]>) => void,
    webdriver?: CreeveyWebdriver,
  ): Promise<StoriesRaw>;
  providerName?: string;
}

// Two-stage story discovery
1. Storybook Story Extraction → Raw Stories
2. Test File Discovery → Enhanced Stories with Tests
```

### TEST EXECUTION PIPELINE

```typescript
// Test lifecycle with strong typing
interface TestResult {
  status: 'failed' | 'success';
  retries: number;
  images?: Partial<Record<string, Images>>;
  error?: string;
  duration?: number;
  attachments?: string[];
  sessionId?: string;
  browserName?: string;
  workerId?: number;
}

// Pipeline stages
Story Discovery → Test Scheduling → Browser Launch →
Screenshot Capture → Image Comparison → Result Aggregation
```

### REAL-TIME UPDATES

```typescript
// WebSocket-based real-time communication
type Response =
  | { type: 'status'; payload: CreeveyStatus }
  | { type: 'update'; payload: CreeveyUpdate }
  | { type: 'capture' };

// Event-driven status updates
interface CreeveyUpdate {
  isRunning?: boolean;
  tests?: Partial<Record<string, TestData>>;
  removedTests?: TestMeta[];
}
```

## CONFIGURATION PATTERNS

### LAYERED CONFIGURATION

```typescript
// Multi-level configuration resolution
interface Config {
  // Core settings with sensible defaults
  storybookUrl: string;           // Default: 'http://localhost:6006'
  screenDir: string;              // Default: './images'
  reportDir: string;              // Default: './report'
  maxRetries: number;             // Default: 0
  testTimeout: number;            // Default: 30000

  // Extensible browser configuration
  browsers: Record<string, BrowserConfig>;

  // Pluggable components
  storiesProvider: StoriesProvider;
  webdriver: CreeveyWebdriverConstructor;
  reporter: BaseReporter | 'creevey' | 'teamcity' | 'junit';
}

// Configuration inheritance hierarchy
1. Built-in defaults
2. Project config files (.creevey/)
3. Environment variables
4. CLI arguments
5. Story-level parameters
```

### BROWSER CONFIGURATION FLEXIBILITY

```typescript
// Union type for flexible browser config
type BrowserConfig = boolean | string | BrowserConfigObject;

// Examples
browsers: {
  chrome: true,                    // Simple enable
  firefox: 'latest',               // Version specification
  safari: {                        // Full configuration
    viewport: { width: 1200, height: 800 },
    playwrightOptions: { headless: false }
  }
}
```

## ERROR HANDLING PATTERNS

### TYPED ERROR CLASSIFICATION

```typescript
// Custom error types for different failure modes
class ImagesError extends Error {
  images?: string | Partial<Record<string, string>>;
}

type WorkerError = 'browser' | 'test' | 'unknown';

// Structured error reporting
interface TestResult {
  status: 'failed' | 'success';
  error?: string; // Human-readable error message
  images?: Partial<Record<string, Images>>; // Visual evidence
}
```

### RETRY MECHANISMS

```typescript
// Configurable retry logic
interface TestData extends TestMeta {
  retries?: number;
  status?: TestStatus;
  results?: TestResult[]; // History of all attempts
}

// Exponential backoff for flaky tests
const retryDelays = [1000, 2000, 4000, 8000];
```

### GRACEFUL DEGRADATION

```typescript
// Fallback strategies for browser automation
1. Playwright → Selenium → Local browsers
2. Docker containers → Local installations
3. Grid providers → Standalone instances
```

## TESTING PATTERNS

### STORY-DRIVEN TESTING

```typescript
// Leverage existing Storybook stories as test foundations
interface CreeveyStoryParams extends CaptureOptions {
  waitForReady?: boolean;
  delay?: number | { for: string[]; ms: number };
  skip?: SkipOptions;
  tests?: Record<string, CreeveyTestFunction>;
}

// Example story with Creevey parameters
export const ButtonStory = {
  parameters: {
    creevey: {
      captureElement: '#button-container',
      tests: {
        hover: async ({ takeScreenshot, matchImage }) => {
          await hover('.button');
          await matchImage(await takeScreenshot(), 'button-hover');
        },
      },
    },
  },
};
```

### INTERACTION TESTING

```typescript
// Context-based test API
interface CreeveyTestContext extends BaseCreeveyTestContext {
  takeScreenshot: () => Promise<Buffer>;
  updateStoryArgs: (updatedArgs: Record<string, unknown>) => Promise<void>;
  captureElement: string | null;
}

// Fluent interaction API
type CreeveyTestFunction = (context: CreeveyTestContext) => Promise<void>;
```

### VISUAL COMPARISON STRATEGIES

```typescript
// Multiple image comparison engines
interface Config {
  diffOptions: PixelmatchOptions; // pixel-level comparison
  odiffOptions: ODiffOptions; // advanced algorithms
}

// Flexible capture options
interface CaptureOptions {
  imageName?: string;
  captureElement?: string | null;
  ignoreElements?: string | string[] | null;
}
```

## UI PATTERNS

### TREE-BASED NAVIGATION

```typescript
// Hierarchical test organization
interface CreeveySuite {
  path: string[];
  skip: boolean;
  status?: TestStatus;
  opened: boolean;
  checked: boolean;
  indeterminate: boolean;
  children: Partial<Record<string, CreeveySuite | CreeveyTest>>;
}

// Type-safe tree traversal
function isTest(x?: CreeveySuite | CreeveyTest): x is CreeveyTest {
  return typeof x?.children === 'undefined';
}
```

### REAL-TIME STATUS UPDATES

```typescript
// State management for live updates
interface CreeveyStatus {
  isRunning: boolean;
  tests: Partial<Record<string, TestData>>;
  browsers: string[];
  isUpdateMode: boolean;
}

// Progressive status indicators
type TestStatus = 'unknown' | 'pending' | 'running' | 'failed' | 'approved' | 'success' | 'retrying';
```

### MULTIPLE VIEW MODES

```typescript
// Image comparison view options
type ImagesViewMode = 'side-by-side' | 'swap' | 'slide' | 'blend';

// Adaptive UI based on content
interface Images {
  actual: string;
  expect?: string;
  diff?: string;
  error?: string;
}
```

## PLUGIN PATTERNS

### STORYBOOK ADDON ARCHITECTURE

```typescript
// Three-part addon structure
1. Manager: Panel integration and UI controls
2. Preview: Story decoration and parameter injection
3. Preset: Configuration and build-time setup

// Cross-frame communication
StorybookEvents: {
  SET_STORIES = 'setStories',
  STORY_RENDERED = 'storyRendered',
  UPDATE_STORY_ARGS = 'updateStoryArgs',
  // ... event-driven coordination
}
```

### REPORTER PLUGIN SYSTEM

```typescript
// Standardized reporter interface
type BaseReporter = new (runner: EventEmitter, options: { reportDir: string; reporterOptions: any }) => void;

// Built-in reporters + extensibility
reporter: BaseReporter | 'creevey' | 'teamcity' | 'junit';
```

## PERFORMANCE PATTERNS

### LAZY LOADING

```typescript
// Deferred resource loading
- Stories loaded on-demand per browser
- Images loaded only when viewing results
- Workers spawned as needed for test execution
```

### CACHING STRATEGIES

```typescript
// Multi-level caching system
1. Browser instance pooling
2. Screenshot baseline caching
3. Compiled test result caching
4. Configuration cache invalidation
```

### PARALLEL EXECUTION

```typescript
// Horizontal scaling patterns
- Worker pool with configurable concurrency
- Browser instance parallelization
- Independent test execution isolation
- Resource-aware scheduling
```

## DEVELOPMENT PATTERNS

### TYPE-FIRST DEVELOPMENT

```typescript
// Comprehensive TypeScript usage
- Strict mode compilation
- Generic type constraints
- Discriminated unions for message types
- Interface-driven architecture
```

### MODULAR ARCHITECTURE

```typescript
// Clear separation of concerns
src/
├── client/          # Frontend React components
├── server/          # Backend Node.js services
├── shared/          # Common utilities and types
└── types.ts         # Central type definitions
```

### CONFIGURATION AS CODE

```typescript
// Programmatic configuration
// .creevey/config.ts
export default {
  browsers: { chrome: true },
  storiesProvider: hybridStoriesProvider,
  hooks: {
    before: async () => {
      /* setup */
    },
    after: async () => {
      /* cleanup */
    },
  },
};
```

## QUALITY PATTERNS

### DEFENSIVE PROGRAMMING

```typescript
// Type guards for runtime safety
function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}
```

### GRACEFUL ERROR RECOVERY

```typescript
// Resilient test execution
- Automatic retry for flaky tests
- Fallback browser providers
- Partial result preservation
- Detailed error context capture
```

### OBSERVABLE BEHAVIOR

```typescript
// Rich telemetry and monitoring
- Test execution metrics
- Browser performance data
- Error tracking and analytics
- Usage pattern analysis
```

---

These system patterns establish the foundation for Creevey's architecture and guide consistent implementation across all components of the system.
