# WebDriver Architecture

## Overview

Creevey implements a flexible WebDriver architecture that abstracts browser automation through a common interface while allowing for different implementations. This design enables Creevey to support both Selenium WebDriver and Playwright for browser automation, giving users the freedom to choose the technology that best fits their needs.

## Core Components

### Base Class: `CreeveyWebdriverBase`

- Located in `src/server/webdriver.ts`
- Defines the core interface and shared functionality for all WebDriver implementations
- Implements common methods like `switchStory` that work across different implementations
- Abstract methods that must be implemented by specific WebDriver classes:
  - `takeScreenshot`
  - `waitForComplete`
  - `selectStory`
  - `updateStoryArgs`
  - `getSessionId`
  - `openBrowser`
  - `closeBrowser`
  - `loadStoriesFromBrowser`
  - `afterTest`

### Implementation: `SeleniumWebdriver`

- Located in `src/server/selenium/webdriver.ts`
- Implements the WebDriver interface using Selenium
- Delegates most functionality to an internal browser implementation
- Manages browser lifecycle and session handling
- Uses the `InternalBrowser` class from `src/server/selenium/internal.ts` for actual implementation

### Implementation: `PlaywrightWebdriver`

- Located in `src/server/playwright/webdriver.ts`
- Implements the WebDriver interface using Playwright
- Similar structure to SeleniumWebdriver but with Playwright-specific implementation
- Uses the `InternalBrowser` class from `src/server/playwright/internal.ts`

### Helper Functions

- Located in `src/server/webdriver.ts`
- `resolveStorybookUrl`: Resolves Storybook URL for remote browser access
- `appendIframePath`: Appends iframe path to Storybook URL
- `getAddresses`: Gets network addresses for Docker communication
- `openBrowser`/`waitForBrowserClose`: Browser lifecycle management utilities

## Flow Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                    CreeveyWebdriverBase                        │
├───────────────────────────────────────────────────────────────┤
│ + switchStory(story, context): Promise<CreeveyTestContext>    │
├───────────────────────────────────────────────────────────────┤
│ # abstract takeScreenshot(...): Promise<Buffer>               │
│ # abstract waitForComplete(...): void                         │
│ # abstract selectStory(...): Promise<boolean>                 │
│ # abstract updateStoryArgs(...): Promise<void>                │
│ # abstract getSessionId(): Promise<string>                    │
│ # abstract openBrowser(...): Promise<CreeveyWebdriver>        │
│ # abstract closeBrowser(): Promise<void>                      │
│ # abstract loadStoriesFromBrowser(): Promise<StoriesRaw>      │
│ # abstract afterTest(...): Promise<void>                      │
└───────────────────────────────────────────────────────────────┘
                           ▲
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────────────────────┐       ┌─────────────────────────┐
│    SeleniumWebdriver    │       │   PlaywrightWebdriver   │
├─────────────────────────┤       ├─────────────────────────┤
│ - #browser: Internal    │       │ - #browser: Internal    │
│ - #browserName: string  │       │ - #browserName: string  │
│ - #gridUrl: string      │       │ - #gridUrl: string      │
│ - #config: Config       │       │ - #config: Config       │
│ - #options: Options     │       │ - #options: Options     │
├─────────────────────────┤       ├─────────────────────────┤
│ + implementation of all │       │ + implementation of all │
│   abstract methods      │       │   abstract methods      │
└─────────────────────────┘       └─────────────────────────┘
          │                                 │
          ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│  Selenium::Internal     │       │  Playwright::Internal   │
├─────────────────────────┤       ├─────────────────────────┤
│ Implementation details  │       │ Implementation details  │
│ specific to Selenium    │       │ specific to Playwright  │
└─────────────────────────┘       └─────────────────────────┘
```

## Key Differences Between Implementations

### Selenium WebDriver

- Uses the standard Selenium WebDriver API
- Supports a wide range of browsers via Selenium Grid
- Relies on browser-specific WebDriver executables
- More mature but potentially slower

### Playwright WebDriver

- Uses the newer Playwright API for browser automation
- Supports Chromium, Firefox, and WebKit
- Has built-in auto-waiting for elements
- Generally faster and more reliable for visual tests
- Better cross-browser compatibility with less configuration

## Browser Session Management

Both implementations follow a similar pattern for browser session management:

1. **Initialization**: `openBrowser()` creates a new browser session or reuses an existing one
2. **Session ID**: `getSessionId()` retrieves a unique identifier for the current session
3. **Story Selection**: `selectStory()` navigates to the specific Storybook story
4. **Screenshot Capture**: `takeScreenshot()` captures a screenshot of the specified element
5. **Cleanup**: `closeBrowser()` closes the browser session when tests are complete

## Docker Integration

Creevey uses Docker for browser isolation through:

- `src/server/docker.ts`: Provides core Docker functionality
- Functions for:
  - `pullImages()`: Pulls required Docker images
  - `buildImage()`: Builds custom Docker images
  - `runImage()`: Runs browsers in containers

## Configuration Options

The WebDriver implementations accept configuration options that control:

- Browser name and version
- Viewport dimensions
- Grid URL for remote execution
- Retry limits and timeouts
- Browser-specific capabilities

## Extension Points

The architecture provides several extension points:

1. **Custom WebDriver Implementation**: Create a new class extending `CreeveyWebdriverBase`
2. **Custom Browser Capabilities**: Configure browser-specific options
3. **Custom Screenshot Capture Logic**: Override the `takeScreenshot` method
4. **Environment-Specific Configurations**: Adapt to different CI environments

## Usage in Worker Process

The WebDriver is used in test workers (`src/server/worker/start.ts`) to:

1. Set up a browser session
2. Navigate to specific stories
3. Execute tests against those stories
4. Capture screenshots for comparison
5. Clean up resources after tests complete
