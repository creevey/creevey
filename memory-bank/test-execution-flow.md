# Test Execution Flow

## Overview

Creevey implements a sophisticated test execution system that enables parallel testing across multiple browsers. The system uses a worker-based architecture to distribute tests and aggregate results. This document outlines the complete flow from test discovery to execution and reporting.

## Core Components

### 1. Test Discovery and Generation

- **Story Loading**: Stories are loaded from Storybook using a provider strategy
- **Test Generation**: Tests are generated based on stories and their parameters
- **Test Registration**: Tests are organized and registered with the test runner

### 2. Worker Management

- **Worker Creation**: Worker processes are created for each browser/configuration
- **Task Distribution**: Tests are distributed to available workers
- **Result Aggregation**: Results from workers are collected and aggregated
- **Error Handling**: Worker errors are captured and reported appropriately

### 3. Test Execution

- **Browser Session**: Each worker manages a browser session
- **Story Navigation**: Workers navigate to specific stories
- **Test Running**: Tests are executed against the loaded stories
- **Screenshot Capture**: Screenshots are captured for visual comparison
- **Reporting**: Results are reported back to the master process

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Master Process                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────┐     ┌───────────────┐      ┌────────────────┐       │
│  │ Configuration │────▶│ Worker Manager│─────▶│ Results Manager│       │
│  └───────────────┘     └───────────────┘      └────────────────┘       │
│         │                     │  ▲                    ▲                 │
│         │                     │  │                    │                 │
│         ▼                     ▼  │                    │                 │
│  ┌───────────────┐     ┌───────────────┐      ┌────────────────┐       │
│  │ Story Provider│────▶│ Test Generator│─────▶│ WebSocket API  │       │
│  └───────────────┘     └───────────────┘      └────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
              │                     │                    ▲
              │                     │                    │
              ▼                     ▼                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                           Worker Processes                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────┐     ┌───────────────┐      ┌────────────────┐       │
│  │   WebDriver   │◀───▶│  Test Runner  │─────▶│ Result Reporter│       │
│  └───────────────┘     └───────────────┘      └────────────────┘       │
│         │                     │                      │                  │
│         │                     │                      │                  │
│         ▼                     ▼                      ▼                  │
│  ┌───────────────┐     ┌───────────────┐      ┌────────────────┐       │
│  │ Browser Session│    │ Screenshot    │      │ Image Comparison│       │
│  └───────────────┘     └───────────────┘      └────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Test Execution Process

### 1. Story Loading

- **Implementation**: `loadTestsFromStories` in `src/server/stories.ts`
- **Process**:
  1. A stories provider loads stories from Storybook
  2. Stories are filtered based on browser configuration
  3. Stories can be loaded directly from browser or Node.js environment
  4. Change detection enables hot-reloading of tests

### 2. Worker Creation

- **Implementation**: `start` function in `src/server/worker/start.ts`
- **Process**:
  1. Workers are created for each browser configuration
  2. Each worker is assigned a browser name and configuration
  3. Workers establish a WebDriver connection
  4. Workers initialize the test environment

### 3. Test Distribution

- **Implementation**: Test messages in `src/server/messages.ts`
- **Process**:
  1. Tests are sent to workers via message passing
  2. Workers acknowledge receipt and execution of tests
  3. Master process tracks which tests are running on which workers
  4. Load balancing ensures efficient test distribution

### 4. Test Execution

- **Implementation**: Test running in `src/server/worker/start.ts`
- **Process**:
  1. Worker receives a test to execute
  2. Worker sets up the browser context
  3. Worker navigates to the specific story
  4. Test function is executed in the context
  5. Screenshots are captured during test execution
  6. Results are collected and reported back

### 5. Screenshot Comparison

- **Implementation**: `matchImage.ts` in `src/server/worker/`
- **Process**:
  1. Screenshots are captured from the browser
  2. Captured images are compared against reference images
  3. Differences are calculated using pixelmatch or odiff
  4. Results with differences are flagged for review
  5. Test succeeds if images match within threshold

### 6. Result Aggregation

- **Implementation**: Message handling in master process
- **Process**:
  1. Workers report test results via messages
  2. Master process collects and aggregates results
  3. Results are stored for reporting and UI display
  4. Failed tests may be retried based on configuration
  5. Complete test results are made available via API

### 7. WebSocket Communication

- **Implementation**: WebSocket server in Koa application
- **Process**:
  1. UI connects to server via WebSocket
  2. Server pushes test status and results in real-time
  3. UI receives and displays results as they arrive
  4. User can approve/reject results through WebSocket API

## Key Files

- `src/server/stories.ts`: Story loading and test generation
- `src/server/worker/start.ts`: Worker process implementation
- `src/server/messages.ts`: Inter-process communication
- `src/server/index.ts`: Master process orchestration
- `src/server/worker/match-image.ts`: Image comparison logic

## Configuration Options

Test execution can be configured with various options:

- **Concurrency**: Number of parallel browser sessions
- **Timeouts**: Maximum time for test execution
- **Retry Logic**: Number of retries for failed tests
- **Browsers**: Which browsers and configurations to test
- **Docker**: Whether to use Docker containers for isolation

## Error Handling

The system handles several types of errors:

- **Browser Errors**: Issues with browser initialization or operation
- **Test Errors**: Failures in test execution or assertions
- **Worker Errors**: Problems with worker processes
- **Timeout Errors**: Tests that exceed allocated time
- **Screenshot Errors**: Issues with capturing or comparing screenshots

When errors occur, they are captured, logged, and reported back to the master process. Depending on the error type and configuration, tests may be retried or marked as failed.

## Hot-Reloading

Creevey supports hot-reloading of tests:

1. File watchers detect changes to test files
2. Changed tests are reloaded without restarting the server
3. UI is updated to reflect new or changed tests
4. Users can run only the changed tests if desired

This enables a rapid development cycle for visual regression tests.
