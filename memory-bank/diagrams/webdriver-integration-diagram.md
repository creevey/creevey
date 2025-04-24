# WebDriver Integration Architecture

This document illustrates the WebDriver integration architecture in Creevey, showing the abstraction layers and implementations for both Selenium and Playwright.

## WebDriver Class Hierarchy

```mermaid
classDiagram
    class CreeveyWebdriverBase {
        <<abstract>>
        +getSessionId()
        +openBrowser()
        +closeBrowser()
        +loadStoriesFromBrowser()
        +switchStory()
        +afterTest()
    }

    class SeleniumWebdriver {
        -internal: SeleniumInternal
        +getSessionId()
        +openBrowser()
        +closeBrowser()
        +loadStoriesFromBrowser()
        +switchStory()
        +afterTest()
    }

    class PlaywrightWebdriver {
        -internal: PlaywrightInternal
        +getSessionId()
        +openBrowser()
        +closeBrowser()
        +loadStoriesFromBrowser()
        +switchStory()
        +afterTest()
    }

    class SeleniumInternal {
        -driver: WebDriver
        -builder: Builder
        -browserName: string
        -gridUrl: string
        +getDriver()
        +buildDriver()
        +quitDriver()
        +executeScript()
        +takeScreenshot()
        +navigateTo()
    }

    class PlaywrightInternal {
        -browser: Browser
        -context: BrowserContext
        -page: Page
        -browserName: string
        -gridUrl: string
        +getBrowser()
        +launchBrowser()
        +closeBrowser()
        +evaluateHandle()
        +takeScreenshot()
        +navigateTo()
    }

    CreeveyWebdriverBase <|-- SeleniumWebdriver
    CreeveyWebdriverBase <|-- PlaywrightWebdriver
    SeleniumWebdriver o-- SeleniumInternal
    PlaywrightWebdriver o-- PlaywrightInternal
```

## WebDriver Implementation Component Diagram

```mermaid
graph TD
    %% Core Components
    Base["CreeveyWebdriverBase<br>(Abstract Interface)"]
    Config["Config & Options"]

    %% Implementations
    Selenium["SeleniumWebdriver<br>Implementation"]
    Playwright["PlaywrightWebdriver<br>Implementation"]

    %% Internal Implementations
    SeleniumInt["SeleniumInternal<br>Implementation"]
    PlaywrightInt["PlaywrightInternal<br>Implementation"]

    %% External Dependencies
    SeleniumDriver["selenium-webdriver<br>Library"]
    PlaywrightLib["playwright-core<br>Library"]
    SeleniumDocker["Selenoid<br>Docker Container"]
    PlaywrightDocker["Playwright<br>Docker Container"]

    %% Connections
    Base --> Selenium
    Base --> Playwright
    Config --> Selenium
    Config --> Playwright

    Selenium --> SeleniumInt
    Playwright --> PlaywrightInt

    SeleniumInt --> SeleniumDriver
    PlaywrightInt --> PlaywrightLib

    SeleniumDriver --> SeleniumDocker
    PlaywrightLib --> PlaywrightDocker

    %% Styling
    classDef abstract fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef implementation fill:#e1f5fe,stroke:#0288d1
    classDef internal fill:#e8f5e9,stroke:#388e3c
    classDef external fill:#fff3e0,stroke:#f57c00
    classDef config fill:#f3e5f5,stroke:#7b1fa2

    class Base abstract
    class Selenium,Playwright implementation
    class SeleniumInt,PlaywrightInt internal
    class SeleniumDriver,PlaywrightLib,SeleniumDocker,PlaywrightDocker external
    class Config config
```

## WebDriver Initialization Sequence

```mermaid
sequenceDiagram
    participant Server
    participant Worker
    participant WebdriverFactory
    participant Webdriver
    participant Internal
    participant Browser

    Server->>Worker: Initialize worker
    Worker->>WebdriverFactory: Create WebDriver instance

    alt Selenium WebDriver
        WebdriverFactory->>Webdriver: Create SeleniumWebdriver
        Webdriver->>Internal: Create SeleniumInternal
        Internal->>Browser: Initialize Selenium session
    else Playwright WebDriver
        WebdriverFactory->>Webdriver: Create PlaywrightWebdriver
        Webdriver->>Internal: Create PlaywrightInternal
        Internal->>Browser: Launch browser
    end

    Browser->>Internal: Browser ready
    Internal->>Webdriver: Driver initialized
    Webdriver->>Worker: WebDriver ready
    Worker->>Server: Worker ready for tests
```

## WebDriver Functionality Components

```mermaid
graph TD
    %% Main Components
    WD["WebDriver Integration"]
    Selenium["Selenium Implementation"]
    Playwright["Playwright Implementation"]

    %% Core Functionality Areas
    Browser["Browser Management"]
    Screenshot["Screenshot Capture"]
    Story["Story Interaction"]
    Elements["Element Actions"]

    %% Dependencies
    Docker["Docker Integration"]
    Config["Configuration System"]

    %% Connections
    WD --> Selenium
    WD --> Playwright

    Selenium --> Browser
    Selenium --> Screenshot
    Selenium --> Story
    Selenium --> Elements

    Playwright --> Browser
    Playwright --> Screenshot
    Playwright --> Story
    Playwright --> Elements

    Browser --> Docker
    Browser --> Config

    %% Styling
    classDef main fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef impl fill:#e1f5fe,stroke:#0288d1
    classDef func fill:#e8f5e9,stroke:#388e3c
    classDef dep fill:#fff3e0,stroke:#f57c00

    class WD main
    class Selenium,Playwright impl
    class Browser,Screenshot,Story,Elements func
    class Docker,Config dep
```

## Configuration Options

The WebDriver implementations are controlled through several configuration options:

### Common Configuration Options

- `browserName`: Name of the browser to use
- `gridUrl`: URL to Selenium Grid or Playwright grid
- `viewport`: Browser viewport dimensions
- `limit`: Maximum number of parallel workers

### Selenium-Specific Options

- `seleniumCapabilities`: WebDriver capabilities
- `browserVersion`: Browser version to use
- `platformName`: Operating system to run on

### Playwright-Specific Options

- `playwrightOptions`: Options for Playwright browser launch
- `trace`: Configuration for Playwright tracing

### Docker Configuration

- `useDocker`: Whether to use Docker for browser isolation
- `dockerImage`: Custom Docker image to use
- `pullImages`: Whether to pull images or use local ones
- `dockerAuth`: Authentication for Docker registry
- `dockerImagePlatform`: Platform for Docker images

## Key Implementation Details

### CreeveyWebdriverBase Interface

The abstract interface that defines the core WebDriver operations required by Creevey:

```typescript
interface CreeveyWebdriver {
  getSessionId(): Promise<string>;
  openBrowser(fresh?: boolean): Promise<CreeveyWebdriver | null>;
  closeBrowser(): Promise<void>;
  loadStoriesFromBrowser(): Promise<StoriesRaw>;
  switchStory(story: StoryInput, context: BaseCreeveyTestContext): Promise<CreeveyTestContext>;
  afterTest(test: ServerTest): Promise<void>;
}
```

### Delegation Pattern

Both implementations use a delegation pattern, forwarding calls to an internal implementation class that handles the details of each WebDriver technology.

### Browser Lifecycle Management

- Browser instances are initialized when workers start
- They can be reused across multiple tests for efficiency
- They are properly closed when workers terminate

## Integration with Test Execution Flow

The WebDriver integration is a critical part of the test execution flow:

1. Worker requests a WebDriver instance
2. WebDriver launches a browser (via Selenium or Playwright)
3. Worker uses WebDriver to navigate to stories
4. WebDriver executes interactions and captures screenshots
5. WebDriver is properly closed when testing is complete

## Related Diagrams

This WebDriver architecture diagram should be viewed alongside:

- System Architecture Overview
- Test Execution Flow Diagram
- Docker Integration Architecture
- Storybook Integration Architecture
