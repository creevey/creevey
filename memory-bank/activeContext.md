# Active Context

## Project Summary

Creevey is a cross-browser screenshot testing tool for Storybook with a fancy UI Runner. It allows developers to create, run, and manage visual regression tests for Storybook components across different browsers.

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

## Current Understanding

From exploration of the codebase, we can see that Creevey consists of:

1. **Core Server Components**:

   - `src/server/index.ts`: Main server entry point
   - `src/server/worker/`: Worker process management
   - `src/server/selenium/` & `src/server/playwright/`: WebDriver implementations
   - `src/server/docker.ts`: Docker integration for browser isolation

2. **Client Components**:

   - `src/client/web/`: UI Runner implementation
   - `src/client/addon/`: Storybook addon integration

3. **Shared Types and Utilities**:

   - `src/types.ts`: Core type definitions
   - `src/shared/`: Shared utilities

4. **Configuration and Documentation**:
   - `docs/`: Documentation files
   - `.creevey/`: Configuration files

## Code Structure

The codebase follows a modular structure with clear separation of concerns:

- Server-side code for test execution
- Client-side code for UI presentation
- Shared code for common functionality
- Type definitions for type safety

## Technical Stack

- **Language**: TypeScript
- **Runtime**: Node.js (18.x+)
- **Key Dependencies**:
  - Storybook
  - Selenium WebDriver / Playwright
  - React
  - Koa
  - WebSockets

## Development Status

- Current version: 0.10.0-beta.43
- Active development with regular updates
- Open source under MIT license

## Conclusions

Creevey is a well-structured, feature-rich visual testing tool specifically designed for Storybook integration. It provides a comprehensive solution for visual regression testing with a focus on developer experience through its UI Runner and tight Storybook integration.
