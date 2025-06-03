# TECHNICAL CONTEXT: CREEVEY

## ARCHITECTURE OVERVIEW

Creevey is built as a distributed testing system with a master-worker architecture, supporting both Playwright and Selenium WebDriver for cross-browser testing. The system consists of multiple interconnected components that work together to provide visual regression testing capabilities.

### SYSTEM ARCHITECTURE

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Tool      │    │  Storybook      │    │   UI Runner     │
│   (Entry Point) │───▶│   (Stories)     │◀───│   (Web UI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CREEVEY MASTER SERVER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Config     │  │  Stories    │  │  Test       │            │
│  │  Manager    │  │  Parser     │  │  Scheduler  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Worker Pool   │    │   Browser       │    │   Image         │
│   (Test Exec)   │    │   Management    │    │   Comparison    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## CORE TECHNOLOGIES

### RUNTIME ENVIRONMENT

- **Node.js**: >= 18.x.x (ES2022 features, modern async/await patterns)
- **TypeScript**: v5.8.2 (Full type safety, strict mode enabled)
- **Module System**: CommonJS with ESM exports support

### BUILD SYSTEM

- **Vite**: v5.4.17 (Primary build tool for client-side code)
- **TypeScript Compiler**: Direct tsc for server-side compilation
- **ESLint**: v9.23.0 (Code quality and consistency)
- **Prettier**: v3.5.3 (Code formatting)

### FRONTEND STACK

- **React**: v18.3.1 (UI components with concurrent features)
- **React DOM**: v18.3.1 (Rendering layer)
- **Storybook**: v8.6.12 (Integration platform and addon system)
- **Vite + React SWC**: Fast development and build pipeline

### TESTING INFRASTRUCTURE

- **Playwright**: v1.51.1 (Primary browser automation)
- **Selenium WebDriver**: v4.30.0 (Legacy and grid support)
- **Vitest**: v2.1.9 (Unit testing framework)
- **Docker**: Containerized browser environments

### IMAGE PROCESSING

- **pixelmatch**: v6.0.0 (Image comparison algorithm)
- **pngjs**: v7.0.0 (PNG image processing)
- **odiff-bin**: v3.2.1 (Advanced visual diffing)

## COMPONENT ARCHITECTURE

### SERVER COMPONENTS

#### Master Server (`src/server/master/`)

- **Handlers**: Request routing and API endpoints
- **Test Scheduling**: Work distribution to worker processes
- **Configuration Management**: Runtime config loading and validation
- **WebSocket Communication**: Real-time updates to UI clients

#### Worker Processes (`src/server/worker/`)

- **Test Execution**: Individual test case running
- **Browser Control**: WebDriver/Playwright integration
- **Screenshot Capture**: Image generation and storage
- **Result Reporting**: Test outcome communication

#### Browser Providers (`src/server/providers/`)

- **Playwright Provider**: Modern browser automation
- **Selenium Provider**: Legacy and grid support
- **Docker Provider**: Containerized browser management
- **Local Provider**: Direct browser instance control

### CLIENT COMPONENTS

#### Storybook Addon (`src/client/addon/`)

- **Manager**: Storybook panel integration
- **Preview**: Story decoration and parameter handling
- **Preset**: Configuration injection into Storybook

#### Web UI (`src/client/web/`)

- **CreeveyView**: Main application interface
- **SideBar**: Navigation and test tree
- **ImagesView**: Screenshot comparison interface
- **Test Management**: Run, approve, and review controls

#### Shared Components (`src/client/shared/`)

- **UI Components**: Reusable interface elements
- **State Management**: Application state handling
- **API Integration**: Server communication layer

## DEVELOPMENT PATTERNS

### CODE ORGANIZATION

- **Feature-based Structure**: Components grouped by functionality
- **Separation of Concerns**: Client, server, and shared code isolation
- **Type-first Development**: Comprehensive TypeScript type definitions
- **Modular Architecture**: Independent, testable modules

### CONFIGURATION SYSTEM

```typescript
// Configuration file structure in .creevey/
interface CreeveyConfig {
  storybookUrl: string;
  browsers: BrowserConfig[];
  diffOptions: DiffConfig;
  captureElement: string | null;
  // ... extensive configuration options
}
```

### TESTING PATTERNS

- **Story-based Tests**: Leverage existing Storybook stories
- **Interaction Testing**: Support for user interaction simulation
- **Async Test Execution**: Promise-based test workflows
- **Retry Mechanisms**: Configurable retry logic for flaky tests

## BROWSER AUTOMATION

### Playwright Integration

```typescript
// Primary automation engine
- Cross-browser support (Chromium, Firefox, WebKit)
- Modern web features (CSS Grid, Flexbox, etc.)
- Network interception capabilities
- Mobile device emulation
- Parallel test execution
```

### Selenium WebDriver Support

```typescript
// Legacy and grid integration
- Grid infrastructure support (LambdaTest, BrowserStack)
- Remote browser execution
- Custom driver configurations
- Enterprise environment compatibility
```

### Docker Integration

```typescript
// Containerized testing environment
- Consistent browser versions across environments
- Isolated test execution
- Easy CI/CD integration
- Resource management and cleanup
```

## DATA FLOW

### Test Execution Flow

1. **Story Discovery**: Parse Storybook stories and extract test cases
2. **Test Scheduling**: Distribute tests across available workers
3. **Browser Automation**: Launch browsers and navigate to stories
4. **Screenshot Capture**: Take screenshots with specified parameters
5. **Image Comparison**: Compare with baseline images using pixel diff
6. **Result Aggregation**: Collect results and generate reports
7. **UI Updates**: Push real-time updates to connected clients

### Configuration Management

```typescript
// Multi-level configuration system
1. Default Configuration (embedded in code)
2. Project Configuration (.creevey/config files)
3. Environment Variables (CI/CD overrides)
4. CLI Arguments (runtime parameters)
5. Story Parameters (test-specific settings)
```

## PERFORMANCE OPTIMIZATIONS

### Parallel Execution

- **Worker Pool**: Multiple browser instances running concurrently
- **Test Distribution**: Intelligent work allocation across workers
- **Resource Management**: Browser instance lifecycle management

### Caching Strategy

- **Image Caching**: Baseline screenshot storage and retrieval
- **Build Caching**: Compiled code caching for faster development
- **Test Result Caching**: Avoid redundant test execution

### Hot Reloading

- **File Watching**: Automatic test re-execution on code changes
- **Incremental Updates**: Only affected tests are re-run
- **Live UI Updates**: Real-time test status in web interface

## INTEGRATION POINTS

### Storybook Integration

```typescript
// Addon integration patterns
- Manager API: Panel and tool integration
- Preview API: Story decoration and parameters
- Preset System: Configuration injection
- Channel Communication: Cross-frame messaging
```

### CI/CD Integration

```typescript
// Continuous integration support
- Exit codes for pass/fail reporting
- JUnit XML output format
- Custom reporters for different CI systems
- Approval workflow integration
```

### External Services

```typescript
// Third-party integrations
- Selenium Grid providers (LambdaTest, BrowserStack, SauceLabs)
- Docker registries for browser images
- GitHub/GitLab API for approval workflows
- Slack/Teams notifications (via webhooks)
```

## SECURITY CONSIDERATIONS

### Browser Security

- **Sandbox Isolation**: Each browser instance runs in isolation
- **Network Restrictions**: Limited external network access during tests
- **File System Access**: Controlled access to test artifacts

### API Security

- **CORS Configuration**: Proper cross-origin request handling
- **WebSocket Security**: Secure real-time communication
- **Input Validation**: Sanitization of user-provided configurations

## MONITORING & DEBUGGING

### Logging System

```typescript
// Multi-level logging with prefixes
- Debug: Detailed execution information
- Info: General operational messages
- Warn: Potential issues and recoverable errors
- Error: Critical failures requiring attention
```

### Telemetry

- **Usage Analytics**: Anonymous usage statistics collection
- **Performance Metrics**: Test execution timing and resource usage
- **Error Reporting**: Crash and exception tracking

### Development Tools

- **Source Maps**: Full debugging support in development
- **Hot Module Replacement**: Instant code updates
- **DevTools Integration**: Browser debugging capabilities

---

This technical context provides a comprehensive foundation for understanding Creevey's architecture and enables informed decision-making for feature development, debugging, and system maintenance.
