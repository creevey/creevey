# Active Context

## Project Summary

Creevey is a cross-browser screenshot testing tool for Storybook with a fancy UI Runner. It allows developers to create, run, and manage visual regression tests for Storybook components across different browsers.

## Complexity Assessment

After thorough analysis, we've determined that Creevey is a **Level 3 (Intermediate Feature)** project based on:

- **Multiple Technical Domains**: WebDriver automation, UI, server, Docker, image processing
- **Distributed Architecture**: Client-server with workers and WebSockets
- **Advanced Integration Points**: Storybook, Browsers, Docker, CI systems
- **Parallel Processing**: Worker-based test execution
- **Complex State Management**: Across server, client, and file system

## Key Features

- Integration with Storybook as an addon
- Cross-browser testing via Selenium or Playwright
- Docker integration for isolated browser environments
- Interactive test writing capabilities
- Web-based UI Runner for test visualization and management
- Hot-reloading of tests during development
- Support for CI/CD integration
- Dual image comparison engines (pixelmatch and odiff-bin)

## Architecture Overview

Creevey follows a client-server architecture:

- **Server**: Node.js application handling test execution, screenshot comparison, and results management
- **Client**: Web UI for test visualization and Storybook addon integration
- **Workers**: Parallel execution of tests across multiple browser instances

## Deep Dive Analyses

We've completed in-depth analyses of several key components:

### 1. WebDriver Architecture

- Abstract base class `CreeveyWebdriverBase` that defines common interface
- Two concrete implementations: `SeleniumWebdriver` and `PlaywrightWebdriver`
- Delegation pattern with internal browser implementations
- Helper functions for URL resolution and browser management

### 2. Test Execution Flow

- Story loading from Storybook through provider strategies
- Worker-based parallel test execution
- Message-based communication between master and workers
- Screenshot capture and comparison logic
- Result aggregation and reporting

### 3. UI Architecture

- React-based component hierarchy
- Multiple image comparison visualization modes
- WebSocket communication for real-time updates
- State management through React Context and immer
- Intuitive test navigation and management

### 4. Docker Integration

- Container-based browser isolation
- Selenoid for Selenium WebDriver integration
- Direct Playwright container management
- Configuration options for custom environments
- Support for Docker-in-Docker scenarios

### 5. Image Comparison System

- Dual-engine approach with pixelmatch and odiff-bin
- odiff-bin is a fast native image comparison tool written in OCaml
- pixelmatch used as the fallback comparison engine
- Configurable thresholds and anti-aliasing detection
- Support for ignoring specific regions in images
- Sophisticated handling of image layouts and sizes

### 6. Storybook Integration

- Custom Storybook addon implementation using the Storybook API
- Multiple story providers for different Storybook versions
- Hybrid provider that combines stories from Storybook and test files
- Decorators to inject Creevey functionality into stories
- Capture mechanism to take screenshots via WebDriver
- Communication via Storybook channels and events
- Synchronized test state between Storybook UI and Creevey server
- Custom UI panels in Storybook for test visualization and control
- Story parameter merging to combine Storybook parameters with test files

## Implementation Strategy

Based on our planning and analysis, Creevey's implementation follows these phases:

1. **Core Infrastructure**: Server initialization, WebDriver integration, Docker management
2. **Storybook Integration**: Addon implementation, story discovery, test generation
3. **UI Runner Development**: React components, WebSocket communication, test visualization
4. **Testing and Optimization**: Cross-browser testing, performance optimization, error handling

## Current Understanding

We now have a deep understanding of the following components:

- **WebDriver Abstraction**: How Creevey abstracts and implements different WebDriver technologies
- **Worker Orchestration**: How parallel test execution is managed
- **UI Components**: How the React-based UI is structured and functions
- **Docker Integration**: How containers are used for browser isolation
- **Inter-Process Communication**: How messages flow between components
- **Image Comparison**: How screenshots are compared and differences are highlighted
- **Storybook Integration**: How Creevey integrates with Storybook to discover and test stories

## Image Comparison Details

Creevey implements two different image comparison engines:

1. **pixelmatch**: A JavaScript-based pixel-by-pixel comparison library

   - Configuration via `diffOptions` property
   - Default threshold: 0.1
   - Anti-aliasing detection optional (default: false)

2. **odiff-bin**: A high-performance native comparison tool written in OCaml
   - Configuration via `odiffOptions` property
   - Default threshold: 0.1
   - Anti-aliasing detection enabled by default
   - Significantly faster than pixelmatch, especially for large images
   - Advanced options like `ignoreRegions` and `diffColor`

The comparison process includes:

- Normalizing image sizes when needed
- Detecting anti-aliased pixels to reduce false positives
- Generating visual diff images with highlighted differences
- Calculating difference metrics (count and percentage)
- Handling cases where expected images don't exist

## Storybook Integration Details

Creevey provides deep integration with Storybook through several mechanisms:

1. **Storybook Addon Architecture**:

   - Registers as a Storybook addon through the `addons.register` API
   - Adds custom panels to the Storybook UI for test visualization and management
   - Creates toolbar items for quick test execution
   - Utilizes Storybook's channel-based communication system

2. **Story Discovery and Loading**:

   - Two main story providers:
     - `browserStoriesProvider`: Extracts stories directly from the Storybook UI (used with CSFv3)
     - `hybridStoriesProvider`: Combines stories from Storybook with tests from separate files
   - The `hybridStoriesProvider` is used by default in the configuration
   - Watches for changes in story and test files for hot-reloading

3. **Test Definition Approaches**:

   - Inline tests defined directly in story parameters using `creevey` key
   - Standalone test files that reference stories using `kind()` and `story()` functions
   - Support for the latest CSF format including hoisted annotations

4. **Story Rendering Control**:

   - Uses Storybook's event system (`SET_CURRENT_STORY`, `FORCE_REMOUNT`, etc.)
   - Waits for story rendering completion before taking screenshots
   - Disables animations and transitions for consistent snapshots
   - Supports waiting for custom ready signals from stories

5. **Storybook UI Enhancements**:
   - Adds status indicators to stories in the sidebar
   - Provides test result visualizations in custom panels
   - Supports approving test results directly from the UI
   - Allows starting/stopping tests for individual stories or browser configurations

The core of this integration lies in the communication between:

- The Storybook addon client (running in the browser)
- The Creevey server (managing test execution)
- The WebDriver implementations (controlling browsers)

This enables seamless visual regression testing directly from the Storybook development environment.

## Design Patterns

The codebase leverages several architectural patterns:

1. **Client-Server Architecture**: Clear separation with WebSocket communication
2. **Plugin Architecture**: Support for different WebDriver implementations
3. **Worker-based Execution**: Parallel test execution via worker processes
4. **Event-driven Communication**: WebSockets and event emitters
5. **Configuration-driven Behavior**: Extensive configuration options
6. **Component-based UI**: React components with clear responsibilities
7. **Strategy Pattern**: Multiple image comparison strategies
8. **Decorator Pattern**: Enhancing stories with testing capabilities
9. **Adapter Pattern**: Adapting different Storybook versions and WebDriver implementations

## Areas for Further Investigation

- Error handling and recovery mechanisms
- Performance optimization opportunities

## Technical Documentation

We've created comprehensive documentation for several key components:

- **webdriver-architecture.md**: WebDriver abstractions and implementations
- **test-execution-flow.md**: Complete test execution flow
- **ui-architecture.md**: Structure and functionality of the React-based UI
- **docker-integration.md**: Docker integration details

## Next Focus Areas

- Performance optimization strategies
- Potential improvement recommendations

## Development Status

- Current version: 0.10.0-beta.43
- Active development with regular updates
- Open source under MIT license

## Conclusions

Creevey is a well-structured, feature-rich visual testing tool specifically designed for Storybook integration. It provides a comprehensive solution for visual regression testing with a focus on developer experience through its UI Runner and tight Storybook integration.
