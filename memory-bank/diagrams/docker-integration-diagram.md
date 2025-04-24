# Docker Integration Architecture

This document illustrates the Docker integration architecture in Creevey, showing how containers are managed for browser isolation.

## Docker Integration Overview

```mermaid
graph TD
    %% Main Components
    Creevey["Creevey Server"]
    Docker["Docker API"]
    Selenoid["Selenoid Container"]
    BrowserContainers["Browser Containers"]

    %% Creevey Components
    DockerMgmt["Docker Management<br>Module"]
    WebdriverInteg["WebDriver<br>Integration"]

    %% Connections
    Creevey --> DockerMgmt
    DockerMgmt --> Docker
    Docker --> Selenoid
    Selenoid --> BrowserContainers
    WebdriverInteg --> Selenoid
    Creevey --> WebdriverInteg

    %% Styling
    classDef main fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef component fill:#bbdefb,stroke:#1976d2,color:black
    classDef external fill:#ffcc80,stroke:#e65100,color:black

    class Creevey main
    class DockerMgmt,WebdriverInteg component
    class Docker,Selenoid,BrowserContainers external
```

## Docker Container Setup Flow

```mermaid
sequenceDiagram
    participant Creevey as Creevey Server
    participant DockerMgr as Docker Manager
    participant Docker as Docker API
    participant Selenoid as Selenoid Container
    participant Browser as Browser Container

    %% Initialization
    Creevey->>DockerMgr: Initialize Docker manager
    DockerMgr->>Docker: Check Docker availability
    Docker->>DockerMgr: Docker status

    %% Pull images if needed
    alt pullImages == true
        DockerMgr->>Docker: Pull Selenoid image
        Docker->>DockerMgr: Selenoid image pulled
        DockerMgr->>Docker: Pull browser images
        Docker->>DockerMgr: Browser images pulled
    end

    %% Start Selenoid
    DockerMgr->>Docker: Create Selenoid container
    Docker->>Selenoid: Start container
    Selenoid->>DockerMgr: Container started

    %% Configure network
    DockerMgr->>Docker: Configure network
    Docker->>DockerMgr: Network configured

    %% Start tests
    Creevey->>Selenoid: Request browser session
    Selenoid->>Browser: Start browser container
    Browser->>Selenoid: Browser ready
    Selenoid->>Creevey: Session created

    %% Cleanup
    Creevey->>DockerMgr: Shutdown request
    DockerMgr->>Docker: Stop containers
    Docker->>Selenoid: Stop container
    Selenoid->>Browser: Stop browser containers
    Docker->>DockerMgr: Containers stopped
```

## Docker Configuration System

```mermaid
graph TD
    %% Configuration Components
    Config["Creevey Configuration"]
    DockerConfig["Docker Configuration"]
    BrowserConfig["Browser Configuration"]

    %% Docker Config Options
    UseDocker["useDocker: boolean"]
    DockerImage["dockerImage: string"]
    PullImages["pullImages: boolean"]
    DockerAuth["dockerAuth: object"]
    DockerPlatform["dockerImagePlatform: string"]

    %% Browser Docker Options
    BrowserDockerImage["browserName.dockerImage: string"]

    %% Connections
    Config --> DockerConfig
    Config --> BrowserConfig

    DockerConfig --> UseDocker
    DockerConfig --> DockerImage
    DockerConfig --> PullImages
    DockerConfig --> DockerAuth
    DockerConfig --> DockerPlatform

    BrowserConfig --> BrowserDockerImage

    %% Styling
    classDef config fill:#e1bee7,stroke:#6a1b9a,color:black
    classDef option fill:#bbdefb,stroke:#1976d2,color:black

    class Config,DockerConfig,BrowserConfig config
    class UseDocker,DockerImage,PullImages,DockerAuth,DockerPlatform,BrowserDockerImage option
```

## Docker Integration Architecture

```mermaid
classDiagram
    class DockerManager {
        -dockerAPI: Docker
        -config: Config
        +initialize()
        +startSelenoid()
        +stopAllContainers()
        +pullImagesIfNeeded()
    }

    class SelenoidManager {
        -dockerManager: DockerManager
        -selenoidContainer: Container
        +start()
        +stop()
        +getGridUrl()
    }

    class BrowserContainer {
        -image: string
        -browserName: string
        -version: string
        +getCapabilities()
    }

    class WebdriverFactory {
        +createWebdriver(browser)
    }

    DockerManager --> SelenoidManager
    SelenoidManager --> BrowserContainer
    WebdriverFactory --> SelenoidManager
```

## Docker Container Architecture

```mermaid
graph TD
    %% Host Components
    Host["Host Machine"]
    CreeveyProcess["Creevey Process"]
    DockerDaemon["Docker Daemon"]

    %% Container Components
    selenoid["Selenoid Container"]
    chrome["Chrome Container"]
    firefox["Firefox Container"]
    safari["Safari Container"]

    %% Network
    selenoidNetwork["Selenoid Network"]

    %% Connections
    Host --> CreeveyProcess
    Host --> DockerDaemon

    DockerDaemon --> selenoid
    DockerDaemon --> chrome
    DockerDaemon --> firefox
    DockerDaemon --> safari

    selenoid --> selenoidNetwork
    chrome --> selenoidNetwork
    firefox --> selenoidNetwork
    safari --> selenoidNetwork

    CreeveyProcess --> selenoid

    %% Styling
    classDef host fill:#bbdefb,stroke:#1976d2,color:black
    classDef container fill:#a5d6a7,stroke:#2e7d32,color:black
    classDef network fill:#ffe0b2,stroke:#e65100,color:black

    class Host,CreeveyProcess,DockerDaemon host
    class selenoid,chrome,firefox,safari container
    class selenoidNetwork network
```

## Playwright Direct Docker Integration

```mermaid
graph TD
    %% Playwright Components
    Creevey["Creevey Server"]
    PlaywrightWD["Playwright WebDriver"]
    DockerAPI["Docker API"]
    PWContainer["Playwright Container"]

    %% Connections
    Creevey --> PlaywrightWD
    PlaywrightWD --> DockerAPI
    DockerAPI --> PWContainer

    %% Styling
    classDef main fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef component fill:#b3e5fc,stroke:#0288d1,color:black
    classDef external fill:#ffcc80,stroke:#e65100,color:black

    class Creevey main
    class PlaywrightWD component
    class DockerAPI,PWContainer external
```

## Docker Configuration Example

Here's a simplified example of how Creevey configures Docker in the code:

```typescript
// Default Docker Configuration
const defaultConfig = {
  useDocker: true,
  dockerImage: 'aerokube/selenoid:latest-release',
  pullImages: true,
  dockerImagePlatform: 'linux/amd64',
  browsers: {
    chrome: {
      browserName: 'chrome',
      dockerImage: 'selenoid/chrome:latest',
    },
    firefox: {
      browserName: 'firefox',
      dockerImage: 'selenoid/firefox:latest',
    },
  },
};

// Docker Manager Implementation
class DockerManager {
  async initialize() {
    if (!this.config.useDocker) return;

    await this.checkDocker();

    if (this.config.pullImages) {
      await this.pullImages();
    }

    await this.startSelenoid();
  }

  // Other methods...
}
```

## Key Integration Points

1. **Docker API Integration**

   - Uses Docker API to manage containers
   - Controls container lifecycle (create, start, stop)
   - Configures networking between containers

2. **Selenoid Integration**

   - Manages Selenoid as a Docker container
   - Automatically starts Selenoid when Creevey launches
   - Provides connection URL to WebDriver implementations

3. **Browser Containers**

   - Dynamically launches browser containers as needed
   - Supports multiple browser types and versions
   - Isolates browser instances for test reliability

4. **Alternative: Direct Playwright Docker Integration**
   - Option to use Playwright containers directly
   - Bypasses Selenoid for Playwright browser automation
   - Uses specialized Playwright Docker images

## Related Diagrams

This Docker integration diagram should be viewed alongside:

- System Architecture Overview
- WebDriver Integration Architecture
- Test Execution Flow
