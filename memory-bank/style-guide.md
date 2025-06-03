# STYLE GUIDE: CREEVEY DEVELOPMENT STANDARDS

## CODE STYLE PRINCIPLES

### PRIMARY GUIDELINES

- **Type Safety First**: Leverage TypeScript's full type system capabilities
- **Explicit Over Implicit**: Prefer clear, explicit code over clever shortcuts
- **Functional Patterns**: Favor immutable data and pure functions where possible
- **Error Handling**: Use typed errors and graceful failure recovery
- **Performance Conscious**: Consider resource usage and scalability implications

### ARCHITECTURAL CONSISTENCY

- **Separation of Concerns**: Clear boundaries between client, server, and shared code
- **Interface-Driven Design**: Define contracts before implementation
- **Configuration Over Code**: Externalize behavior through configuration
- **Provider Pattern**: Use abstraction for pluggable implementations
- **Message-Based Communication**: Type-safe inter-process messaging

## TYPESCRIPT STANDARDS

### TYPE DEFINITIONS

#### Interface Design

```typescript
// ✅ Good: Comprehensive interface with clear purpose
interface CreeveyTestContext extends BaseCreeveyTestContext {
  takeScreenshot: () => Promise<Buffer>;
  updateStoryArgs: (updatedArgs: Record<string, unknown>) => Promise<void>;
  captureElement: string | null;
}

// ❌ Avoid: Vague or overly generic interfaces
interface Context {
  data: any;
  methods: Function[];
}
```

#### Union Types and Discrimination

```typescript
// ✅ Good: Discriminated unions for type safety
type ProcessMessage =
  | (WorkerMessage & { scope: 'worker' })
  | (StoriesMessage & { scope: 'stories' })
  | (TestMessage & { scope: 'test' })
  | (ShutdownMessage & { scope: 'shutdown' });

// Type guards for runtime safety
function isWorkerMessage(message: unknown): message is WorkerMessage {
  return isObject(message) && 'type' in message;
}
```

#### Generic Constraints

```typescript
// ✅ Good: Constrained generics for type safety
function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

// ✅ Good: Complex generic patterns when needed
type BrowserConfig = boolean | string | BrowserConfigObject;
```

### NAMING CONVENTIONS

#### File and Directory Structure

```
src/
├── client/              # Frontend-specific code
│   ├── addon/          # Storybook addon components
│   ├── shared/         # Shared client utilities
│   └── web/            # Web UI application
├── server/             # Backend-specific code
│   ├── master/         # Master process handlers
│   ├── worker/         # Worker process logic
│   └── providers/      # Browser automation providers
├── shared/             # Cross-platform utilities
└── types.ts           # Central type definitions
```

#### Variable and Function Naming

```typescript
// ✅ Good: Descriptive, purpose-driven names
const maxRetryAttempts = 3;
const browserCapabilities = await getBrowserCapabilities(config);
async function captureElementScreenshot(element: string): Promise<Buffer>;

// ❌ Avoid: Abbreviated or cryptic names
const max = 3;
const caps = await getCaps(cfg);
async function capElSS(el: string): Promise<Buffer>;
```

#### Type and Interface Naming

```typescript
// ✅ Good: Clear, descriptive type names
interface CreeveyStoryParams extends CaptureOptions
type TestStatus = 'unknown' | 'pending' | 'running' | 'failed' | 'approved' | 'success'
class ImagesError extends Error

// ✅ Good: Consistent naming patterns
type WorkerHandler = (message: WorkerMessage) => void;
type StoriesHandler = (message: StoriesMessage) => void;
type TestHandler = (message: TestMessage) => void;
```

## ERROR HANDLING PATTERNS

### Typed Error System

```typescript
// ✅ Good: Custom error types with context
class ImagesError extends Error {
  images?: string | Partial<Record<string, string>>;

  constructor(message: string, images?: string | Partial<Record<string, string>>) {
    super(message);
    this.name = 'ImagesError';
    this.images = images;
  }
}

// ✅ Good: Error classification
type WorkerError = 'browser' | 'test' | 'unknown';

interface TestResult {
  status: 'failed' | 'success';
  error?: string; // Human-readable error message
  images?: Partial<Record<string, Images>>; // Context for failures
}
```

### Error Recovery Strategies

```typescript
// ✅ Good: Graceful degradation with fallbacks
async function openBrowser(fresh = false): Promise<CreeveyWebdriver | null> {
  try {
    return await this.playwrightProvider.open(fresh);
  } catch (playwrightError) {
    try {
      return await this.seleniumProvider.open(fresh);
    } catch (seleniumError) {
      // Log both errors and return null for graceful handling
      logger.warn('All browser providers failed', { playwrightError, seleniumError });
      return null;
    }
  }
}
```

## CONFIGURATION PATTERNS

### Layered Configuration Design

```typescript
// ✅ Good: Configuration hierarchy with defaults
interface Config {
  // Required with sensible defaults
  storybookUrl: string; // Default: 'http://localhost:6006'
  screenDir: string; // Default: './images'
  reportDir: string; // Default: './report'

  // Optional with fallbacks
  maxRetries: number; // Default: 0
  testTimeout: number; // Default: 30000

  // Extensible systems
  browsers: Record<string, BrowserConfig>;
  storiesProvider: StoriesProvider;
  webdriver: CreeveyWebdriverConstructor;
}
```

### Flexible Configuration Types

```typescript
// ✅ Good: Union types for configuration flexibility
type BrowserConfig = boolean | string | BrowserConfigObject;

// Usage examples:
const config = {
  browsers: {
    chrome: true, // Simple enable
    firefox: 'latest', // Version string
    safari: {
      // Full configuration object
      viewport: { width: 1200, height: 800 },
      playwrightOptions: { headless: false },
    },
  },
};
```

## ASYNC PATTERNS

### Promise-Based APIs

```typescript
// ✅ Good: Consistent async/await usage
async function executeTest(test: ServerTest): Promise<TestResult> {
  try {
    const context = await this.webdriver.switchStory(test.story, baseContext);
    await test.fn(context);
    return { status: 'success', retries: test.retries };
  } catch (error) {
    return {
      status: 'failed',
      retries: test.retries,
      error: error.message,
      images: error instanceof ImagesError ? error.images : undefined,
    };
  }
}
```

### Message-Based Communication

```typescript
// ✅ Good: Type-safe message passing
async function sendMessage<T extends ProcessMessage>(worker: Worker, message: T): Promise<void> {
  return new Promise((resolve, reject) => {
    worker.send(message, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
```

## TESTING PATTERNS

### Test Organization

```typescript
// ✅ Good: Story-driven test structure
export const ButtonStory = {
  parameters: {
    creevey: {
      captureElement: '#button-container',
      tests: {
        'default state': async ({ takeScreenshot, matchImage }) => {
          await matchImage(await takeScreenshot(), 'button-default');
        },
        'hover state': async ({ takeScreenshot, matchImage, webdriver }) => {
          await webdriver.actions().move({ origin: '.button' }).perform();
          await matchImage(await takeScreenshot(), 'button-hover');
        },
        'focus state': async ({ takeScreenshot, matchImage, webdriver }) => {
          await webdriver.findElement(By.css('.button')).click();
          await matchImage(await takeScreenshot(), 'button-focus');
        },
      },
    },
  },
};
```

### Context-Based Testing API

```typescript
// ✅ Good: Rich context with clear capabilities
interface CreeveyTestContext extends BaseCreeveyTestContext {
  takeScreenshot: () => Promise<Buffer>;
  updateStoryArgs: (updatedArgs: Record<string, unknown>) => Promise<void>;
  captureElement: string | null;
  matchImage: (image: Buffer | string, imageName?: string) => Promise<void>;
  matchImages: (images: Record<string, Buffer | string>) => Promise<void>;
}
```

## UI COMPONENT PATTERNS

### React Component Standards

```typescript
// ✅ Good: Typed props with clear interfaces
interface TestResultsViewProps {
  tests: Partial<Record<string, TestData>>;
  onApprove: (testId: string, retry: number, image: string) => void;
  onApproveAll: () => void;
  imagesViewMode: ImagesViewMode;
  setImagesViewMode: (mode: ImagesViewMode) => void;
}

const TestResultsView: React.FC<TestResultsViewProps> = ({
  tests,
  onApprove,
  onApproveAll,
  imagesViewMode,
  setImagesViewMode,
}) => {
  // Component implementation
};
```

### State Management

```typescript
// ✅ Good: Immutable state updates with type safety
interface CreeveyStatus {
  isRunning: boolean;
  tests: Partial<Record<string, TestData>>;
  browsers: string[];
  isUpdateMode: boolean;
}

function updateTestStatus(status: CreeveyStatus, testId: string, newTestData: Partial<TestData>): CreeveyStatus {
  return {
    ...status,
    tests: {
      ...status.tests,
      [testId]: {
        ...status.tests[testId],
        ...newTestData,
      },
    },
  };
}
```

## PERFORMANCE PATTERNS

### Resource Management

```typescript
// ✅ Good: Explicit resource lifecycle management
class WorkerPool {
  private workers = new Map<string, Worker>();

  async createWorker(browserId: string): Promise<Worker> {
    const worker = cluster.fork();
    this.workers.set(browserId, worker);

    // Set up cleanup on worker exit
    worker.on('exit', () => {
      this.workers.delete(browserId);
    });

    return worker;
  }

  async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.workers.values()).map((worker) => this.shutdownWorker(worker));

    await Promise.all(shutdownPromises);
    this.workers.clear();
  }
}
```

### Lazy Loading Patterns

```typescript
// ✅ Good: Deferred resource loading
class StoryProvider {
  private storiesCache?: StoriesRaw;

  async getStories(): Promise<StoriesRaw> {
    if (!this.storiesCache) {
      this.storiesCache = await this.loadStoriesFromBrowser();
    }
    return this.storiesCache;
  }

  invalidateCache(): void {
    this.storiesCache = undefined;
  }
}
```

## DOCUMENTATION STANDARDS

### Code Comments

```typescript
/**
 * Executes a visual regression test for a specific story
 * @param test - The test configuration and story details
 * @param context - The browser context for test execution
 * @returns Promise resolving to test results with images and status
 */
async function executeVisualTest(test: ServerTest, context: CreeveyTestContext): Promise<TestResult> {
  // Implementation details...
}

// ✅ Good: Inline comments for complex logic
// Calculate retry delay using exponential backoff
const retryDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
```

### Interface Documentation

```typescript
/**
 * Configuration for browser automation providers
 * Supports both Playwright and Selenium WebDriver
 */
interface BrowserConfigObject {
  /** Browser name (chrome, firefox, safari, edge) */
  browserName: string;

  /** Maximum number of concurrent browser instances */
  limit?: number;

  /**
   * Selenium grid URL for remote browser execution
   * @default config.gridUrl
   */
  gridUrl?: string;

  /**
   * Custom Docker image for containerized testing
   * @default `selenoid/${browserName}:latest`
   */
  dockerImage?: string;
}
```

## BUILD AND DEPLOYMENT

### Package.json Scripts

```json
{
  "scripts": {
    "clean": "rm -rf dist",
    "lint": "concurrently \"yarn lint:tsc\" \"yarn lint:eslint\" \"yarn lint:prettier\"",
    "lint:tsc": "tsc --noEmit",
    "lint:eslint": "eslint",
    "lint:prettier": "prettier --check .",
    "build": "yarn prebuild && yarn build:client && yarn build:creevey && yarn postbuild",
    "build:client": "vite build",
    "build:creevey": "tsc --build tsconfig.prod.json"
  }
}
```

### TypeScript Configuration

```json
// tsconfig.json - Development configuration
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## QUALITY ASSURANCE

### Code Quality Metrics

- **TypeScript Strict Mode**: All code must compile with strict type checking
- **ESLint Compliance**: Zero linting errors in production code
- **Prettier Formatting**: Consistent code formatting across all files
- **Test Coverage**: Critical paths must have corresponding tests
- **Documentation**: Public APIs must have comprehensive documentation

### Review Standards

- **Type Safety**: All public interfaces must be properly typed
- **Error Handling**: Failure modes must be explicitly handled
- **Performance**: Resource usage must be considered for long-running operations
- **Compatibility**: Changes must maintain backward compatibility
- **Testing**: New features require corresponding tests

---

These style guidelines ensure consistency, maintainability, and quality across the Creevey codebase while supporting the complex requirements of cross-browser visual testing.
