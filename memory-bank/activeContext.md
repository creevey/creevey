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

## Design Patterns

The codebase leverages several architectural patterns:

1. **Client-Server Architecture**: Clear separation with WebSocket communication
2. **Plugin Architecture**: Support for different WebDriver implementations
3. **Worker-based Execution**: Parallel test execution via worker processes
4. **Event-driven Communication**: WebSockets and event emitters
5. **Configuration-driven Behavior**: Extensive configuration options
6. **Component-based UI**: React components with clear responsibilities

## Areas for Further Investigation

- Image comparison algorithms and strategies
- Storybook integration and addon implementation
- Error handling and recovery mechanisms
- Performance optimization opportunities

## Technical Documentation

We've created comprehensive documentation for several key components:

- **webdriver-architecture.md**: WebDriver abstractions and implementations
- **test-execution-flow.md**: Complete test execution flow
- **ui-architecture.md**: UI component structure and functionality
- **docker-integration.md**: Docker integration details

## Next Focus Areas

- Image comparison algorithms
- Storybook integration specifics
- Performance optimization strategies
- Potential improvement recommendations

## Development Status

- Current version: 0.10.0-beta.43
- Active development with regular updates
- Open source under MIT license

## Conclusions

Creevey is a well-structured, feature-rich visual testing tool specifically designed for Storybook integration. It provides a comprehensive solution for visual regression testing with a focus on developer experience through its UI Runner and tight Storybook integration.
