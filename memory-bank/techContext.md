# Technical Context

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js (18.x+)
- **Key Dependencies**:
  - Storybook (7.x+)
  - Playwright/Selenium WebDriver (for browser automation)
  - React (for UI components)
  - Koa (for server implementation)
  - WebSocket (for real-time communication)
  - Docker (for browser isolation)

## Architecture

Creevey follows a client-server architecture:

1. **Server**:

   - Manages browser sessions through WebDriver
   - Handles test execution and orchestration
   - Processes screenshot comparison
   - Maintains test results and status

2. **Client**:

   - UI Runner for test visualization
   - Storybook integration (as an addon)
   - Reports test results in a user-friendly way
   - Provides tools for approving/rejecting visual changes

3. **Test Execution**:
   - Can run in Docker containers for isolation
   - Supports multiple browser configurations
   - Captures screenshots of Storybook components
   - Compares against baseline screenshots
   - Reports differences visually

## Key Components

- **WebDriver Integration**: Supports both Selenium and Playwright
- **Screenshot Comparison**: Uses pixelmatch or odiff for image comparison
- **Test Runner**: Custom implementation based on Mocha
- **UI Interface**: React-based web application
- **Storybook Addon**: Integration with Storybook
- **Docker Management**: For isolated browser environments

## File Structure

- **src/server**: Backend implementation
- **src/client**: Frontend UI and Storybook addon
- **src/shared**: Shared types and utilities
- **src/types.ts**: Core type definitions
- **docs/**: Documentation files
- **.creevey/**: Configuration files

## Architecture Diagrams

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────┐
│  Storybook UI   │<─────│  Creevey Addon   │<─────│  Creevey UI   │
└─────────────────┘      └──────────────────┘      └───────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Creevey Server                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐             │
│  │ Test Runner │  │ WebDriver   │  │ Screenshot   │             │
│  │             │  │ Integration │  │ Comparison   │             │
│  └─────────────┘  └─────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Browser 1  │      │    Browser 2    │      │    Browser N    │
└─────────────┘      └─────────────────┘      └─────────────────┘
```

## Integration Points

- **Storybook**: Via addon integration
- **Browsers**: Via Selenium or Playwright
- **CI Systems**: Can run as part of CI pipelines
- **Docker**: For container-based browser execution
