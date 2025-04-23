# Comprehensive Architecture Documentation for Creevey

This document serves as the central reference for Creevey's architecture, integrating all component diagrams into a cohesive overview of the system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Key Components](#key-components)
3. [Core Processes](#core-processes)
4. [Integration Points](#integration-points)
5. [Technology Stack](#technology-stack)
6. [Design Patterns](#design-patterns)
7. [References to Detailed Diagrams](#references-to-detailed-diagrams)

## System Overview

Creevey is a cross-browser screenshot testing tool for Storybook with a fancy UI Runner. The system follows a client-server architecture with several key subsystems:

1. **Client Layer**: Web-based UI for test visualization and management
2. **Server Layer**: Orchestrates test execution and processes results
3. **Worker Processes**: Handles parallel test execution
4. **WebDriver Integration**: Controls browser instances
5. **Storybook Integration**: Discovers and interacts with stories
6. **Docker Integration**: Manages browser isolation
7. **Image Comparison**: Compares screenshots with baselines

The high-level system architecture is visualized in [system-overview-diagram.md](system-overview-diagram.md).

## Key Components

### Client Components

- **UI Runner**: React-based web application
  - Test visualization components
  - Image comparison visualization
  - Test management interface
  - WebSocket client for real-time updates

### Server Components

- **Test Orchestration**: Manages the test execution process
  - Worker management
  - Test scheduling and queueing
  - Result aggregation
  - WebSocket server for client communication
- **WebDriver Integration**: Abstraction layer for browser control
  - SeleniumWebdriver implementation
  - PlaywrightWebdriver implementation
  - Browser session management
- **Story Providers**: Responsible for loading stories
  - Browser-based provider
  - Hybrid provider (combining stories with test files)
- **Image Comparison**: Compares screenshots with baselines
  - Pixelmatch implementation
  - Odiff-bin implementation
  - Difference visualization

### External Integrations

- **Storybook**: Component development environment
  - Creevey addon for Storybook
  - Channel-based communication
  - Story parameter extension
- **Docker**: Container-based browser isolation
  - Selenoid for Selenium WebDriver
  - Playwright containers
  - Container lifecycle management

## Core Processes

### Test Execution Flow

The complete test execution flow is visualized in [test-execution-flow-diagram.md](test-execution-flow-diagram.md). The high-level process includes:

1. **Test Initialization**:

   - Client requests test execution
   - Server loads stories
   - Server generates test cases

2. **Test Execution**:

   - Workers are spawned and assigned tests
   - WebDriver controls browser instances
   - Stories are loaded and rendered
   - Screenshots are captured

3. **Result Processing**:
   - Screenshots are compared with baselines
   - Differences are visualized
   - Results are reported to the client

### WebDriver Integration

The WebDriver integration architecture is detailed in [webdriver-integration-diagram.md](webdriver-integration-diagram.md). Key aspects include:

1. **Abstraction Layer**:

   - Common interface for different WebDriver implementations
   - Delegation pattern for implementation details

2. **Browser Control**:
   - Browser initialization and navigation
   - Screenshot capture
   - Interaction execution

### Storybook Integration

The Storybook integration architecture is illustrated in [storybook-integration-diagram.md](storybook-integration-diagram.md). It includes:

1. **Addon Components**:

   - Panel UI in Storybook
   - Story decorators
   - Channel-based communication

2. **Story Discovery**:
   - Loading stories from Storybook
   - Merging with external test definitions
   - Generating test cases

## Integration Points

### Client-Server Communication

The client and server communicate through a WebSocket connection, with the following key message types:

- **Status Messages**: Current test status and results
- **Control Messages**: Commands to start/stop tests
- **Update Messages**: Real-time test updates

### Worker-Server Communication

Workers communicate with the server through Inter-Process Communication (IPC) with message types:

- **Worker Messages**: Worker status and initialization
- **Test Messages**: Test assignments and results
- **Shutdown Messages**: Graceful termination

### Storybook-Creevey Communication

Storybook and Creevey communicate through:

- **Channel Events**: Standard Storybook communication
- **WebDriver Scripts**: Direct interaction via browser automation
- **Story Parameters**: Configuration and test definitions

## Technology Stack

Creevey is built with the following technologies:

- **Language**: TypeScript
- **Runtime**: Node.js
- **UI Framework**: React
- **Server**: Koa
- **Communication**: WebSockets
- **Browser Automation**: Selenium WebDriver and Playwright
- **Containerization**: Docker
- **Image Processing**: Pixelmatch and Odiff-bin
- **Testing**: Mocha-like framework

## Design Patterns

Creevey employs several architectural patterns:

1. **Client-Server Architecture**: Clear separation with WebSocket communication
2. **Plugin Architecture**: Support for different WebDriver implementations
3. **Worker-based Execution**: Parallel test execution via worker processes
4. **Event-driven Communication**: WebSockets and event emitters
5. **Configuration-driven Behavior**: Extensive configuration options
6. **Component-based UI**: React components with clear responsibilities
7. **Strategy Pattern**: Multiple image comparison strategies
8. **Decorator Pattern**: Enhancing stories with testing capabilities
9. **Adapter Pattern**: Adapting different Storybook versions and WebDriver implementations

## References to Detailed Diagrams

For more detailed information about specific components, refer to these diagrams:

- [System Overview Diagram](system-overview-diagram.md)
- [Test Execution Flow Diagram](test-execution-flow-diagram.md)
- [WebDriver Integration Diagram](webdriver-integration-diagram.md)
- [Storybook Integration Diagram](storybook-integration-diagram.md)
- [Docker Integration Documentation](docker-integration.md)
- [UI Architecture Documentation](ui-architecture.md)

## Conclusion

This comprehensive architecture documentation provides a high-level overview of Creevey's structure and functionality. The modular design allows for extension and customization, while the clear separation of concerns facilitates maintenance and evolution.

The architecture follows best practices for test automation tools, with a focus on:

1. **Extensibility**: Support for multiple WebDriver implementations and image comparison engines
2. **Parallelization**: Efficient test execution through worker processes
3. **Isolation**: Container-based browser isolation
4. **Real-time Updates**: WebSocket-based communication for immediate feedback
5. **Integration**: Seamless integration with Storybook and CI systems
