# Creevey Architecture Documentation

## System Architecture Overview

Creevey follows a client-server architecture with a master-worker pattern for distributed test execution.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │   CLI Client    │    │   Storybook     │
│   (React)       │    │   (Node.js)     │    │   (Browser)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ HTTP/WebSocket       │ CLI Commands         │ HTTP
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Creevey Server                               │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Master        │   Stories       │   Worker Pool               │
│   Process       │   Provider      │   (Cluster Workers)         │
│                 │                 │                             │
│ • Test Queue    │ • Story Parsing │ • Test Execution            │
│ • Result Agg.   │ • Story Loading │ • Browser Control          │
│ • API Server    │ • Test Discovery│ • Screenshot Capture        │
└─────────────────┴─────────────────┴─────────────────────────────┘
          │                      │                      │
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Report Dir    │    │   Screen Dir    │    │   Docker/Selenium│
│   (Results)     │    │   (References)  │    │   Grid          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Master Process (`src/server/master/`)

**Main Entry**: `src/server/master/master.ts`

**Responsibilities**:

- Test orchestration and scheduling
- Worker process management
- Result aggregation and reporting
- API server for UI communication
- WebSocket handling for real-time updates

**Key Modules**:

- `api.ts` - HTTP API endpoints
- `runner.ts` - Test execution coordination
- `queue.ts` - Test queue management
- `pool.ts` - Worker pool management
- `testsManager.ts` - Test lifecycle management

### 2. Stories Providers (`src/server/providers/`)

**Purpose**: Extract and manage Storybook stories for testing

#### Browser Stories Provider (`browser.ts`)

- Connects to running Storybook instance
- Extracts stories via Storybook API
- Limited to static screenshots (no interactive tests)
- Uses browser automation to discover stories

#### Hybrid Stories Provider (`hybrid.ts`) - **Default**

- Combines Storybook stories with separate test files
- Supports interactive tests with webdriver
- Parses `.creevey.ts` files for test definitions
- Merges story metadata with test specifications

### 3. Webdriver Implementations

#### Selenium Webdriver (`src/server/selenium/`)

**Files**: `internal.ts`, `webdriver.ts`, `selenoid.ts`

**Features**:

- Selenium WebDriver API
- Selenoid integration for Docker
- Grid support (BrowserStack, SauceLabs, etc.)
- Legacy compatibility

#### Playwright Webdriver (`src/server/playwright/`)

**Files**: `internal.ts`, `webdriver.ts`, `docker.ts`

**Features**:

- Modern browser automation
- Better performance and reliability
- Advanced debugging capabilities
- Native browser support

### 4. Worker Processes (`src/server/worker/`)

**Main Entry**: `src/server/worker/start.ts`

**Responsibilities**:

- Single test execution
- Browser automation
- Screenshot capture
- Image comparison
- Result reporting

**Key Modules**:

- `context.ts` - Test context setup
- `match-image.ts` - Image comparison logic
- `chai-image.ts` - Custom assertions

### 5. Client UI (`src/client/`)

#### Web Application (`src/client/web/`)

- React-based test runner UI
- Real-time test status updates
- Image comparison viewer
- Test result management

#### Shared Components (`src/client/shared/`)

- Reusable UI components
- Image viewing components
- Utility functions

## Data Flow

### Test Discovery Flow

```
1. CLI/UI Request → Master Process
2. Master → Stories Provider
3. Stories Provider → Storybook API + File System
4. Stories Provider → Master (with test definitions)
5. Master → Worker Pool (test queue)
```

### Test Execution Flow

```
1. Worker → Test Queue (get next test)
2. Worker → Browser Automation (launch browser)
3. Worker → Storybook (load story)
4. Worker → Test Function (execute interactions)
5. Worker → Screenshot Capture
6. Worker → Image Comparison
7. Worker → Master (test result)
8. Master → UI/Reporter (real-time update)
```

### Image Comparison Pipeline

```
Screenshot → Buffer → File System
                ↓
Reference Image → File System
                ↓
Comparison Engine (pixelmatch/odiff)
                ↓
Diff Image + Result → Report Directory
```

## Configuration System

### Configuration Loading (`src/server/config.ts`)

1. Resolve config file path (`.creevey/config.ts` or `creevey.config.ts`)
2. Load and parse TypeScript configuration
3. Apply CLI overrides
4. Normalize browser configurations
5. Set up defaults

### Browser Configuration

```typescript
interface BrowserConfigObject {
  browserName: string; // Browser identifier
  limit?: number; // Parallel instances
  gridUrl?: string; // Custom grid URL
  viewport?: { width; height }; // Browser viewport
  seleniumCapabilities?: {}; // Selenium-specific options
  playwrightOptions?: {}; // Playwright-specific options
}
```

## Message Passing System

### Process Communication

- **Cluster IPC**: Master ↔ Worker communication
- **WebSocket**: UI ↔ Server real-time updates
- **HTTP API**: UI ↔ Server REST operations

### Message Types (`src/types.ts`)

```typescript
type ProcessMessage =
  | WorkerMessage // Worker lifecycle
  | StoriesMessage // Story discovery
  | TestMessage // Test execution
  | ShutdownMessage; // Process termination
```

## Docker Integration

### Selenoid Integration (`src/server/selenium/selenoid.ts`)

- Automatic Docker container management
- Browser image downloading and caching
- Container lifecycle management
- Network configuration

### Playwright Docker (`src/server/playwright/docker.ts`)

- Playwright browser containers
- Custom image support
- Volume mounting for screenshots
- Port management

## Image Comparison

### Comparison Engines

1. **pixelmatch** - Default, JavaScript-based
2. **odiff** - Optional, Rust-based (faster)

### Configuration Options

```typescript
interface PixelmatchOptions {
  threshold: number; // Difference threshold (0-1)
  includeAA: boolean; // Include anti-aliased pixels
}

interface ODiffOptions {
  threshold: number; // Difference threshold (0-1)
  antialiasing: boolean; // Handle anti-aliasing
}
```

## Reporting System

### Reporters (`src/server/reporters/`)

- **creevey** - Default HTML reporter
- **junit** - JUnit XML format
- **teamcity** - TeamCity integration

### Report Structure

```
report/
├── index.html          # Main report UI
├── results.json        # Test results data
├── images/             # Screenshot comparisons
│   ├── actual/         # Current screenshots
│   ├── expect/         # Reference images
│   └── diff/           # Difference images
└── metadata/           # Test metadata
```

## Extension Points

### Custom Webdrivers

Implement `CreeveyWebdriver` interface:

```typescript
interface CreeveyWebdriver {
  getSessionId(): Promise<string>;
  openBrowser(): Promise<CreeveyWebdriver>;
  closeBrowser(): Promise<void>;
  loadStoriesFromBrowser(): Promise<StoriesRaw>;
  switchStory(): Promise<CreeveyTestContext>;
  afterTest(): Promise<void>;
}
```

### Custom Stories Providers

Implement `StoriesProvider` interface:

```typescript
interface StoriesProvider {
  (config, storiesListener, webdriver?): Promise<StoriesRaw>;
  providerName?: string;
}
```

### Custom Reporters

Implement Mocha-compatible reporter interface with Creevey extensions.

## Performance Considerations

### Parallelization

- Worker pool based on CPU cores
- Browser instance limits per configuration
- Test queue optimization

### Resource Management

- Browser process cleanup
- Memory usage monitoring
- Docker container lifecycle

### Caching Strategies

- Storybook metadata caching
- Browser session reuse
- Image comparison caching

## Security Considerations

### Docker Security

- Container isolation
- Network restrictions
- Volume mounting permissions

### Webdriver Security

- Browser sandboxing
- Remote grid authentication
- Sensitive data handling

## Debugging Support

### Debug Modes

- `--debug`: Enhanced logging
- `--trace`: Verbose tracing
- Playwright traces and screenshots

### Logging System

- Structured logging with loglevel
- Worker process logs aggregation
- Real-time log streaming to UI
