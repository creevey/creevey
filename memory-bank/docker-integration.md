# Docker Integration

## Overview

Creevey utilizes Docker to provide isolated, reproducible browser environments for visual testing. This approach ensures consistent test results across different machines and CI environments. The Docker integration in Creevey supports both Selenium and Playwright WebDrivers with their specific container requirements.

## Core Components

### 1. Docker Management

- **`src/server/docker.ts`**: Core Docker functionality
- Provides functions for image management, container creation, and execution
- Uses the Dockerode library for Docker API communication
- Handles authentication for private Docker registries

### 2. Selenium Integration

- **`src/server/selenium/selenoid.ts`**: Selenoid-specific Docker implementation
- Manages Selenoid containers for Selenium WebDriver
- Configures browser containers for Selenium testing
- Supports standalone mode (without Docker) for environments where Docker is unavailable

### 3. Playwright Integration

- **`src/server/playwright/docker.ts`**: Playwright-specific Docker implementation
- Manages Playwright containers for browser testing
- Configures port mapping and volume mounting for traces
- Provides WebSocket communication with Playwright browsers

## Flow Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                      Creevey Docker Integration                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────┐                         ┌────────────────┐        │
│  │Docker Manager │                         │  Config Parser │        │
│  └───────────────┘                         └────────────────┘        │
│         │                                          │                  │
│         ▼                                          ▼                  │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                     WebDriver Strategy                         │   │
│  └───────────────────────────────────────────────────────────────┘   │
│         │                                          │                  │
│         ▼                                          ▼                  │
│  ┌───────────────┐                         ┌────────────────┐        │
│  │    Selenoid   │                         │   Playwright   │        │
│  └───────────────┘                         └────────────────┘        │
│         │                                          │                  │
│         ▼                                          ▼                  │
│  ┌───────────────┐                         ┌────────────────┐        │
│  │Browser Images │                         │Browser Container│        │
│  └───────────────┘                         └────────────────┘        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Docker Implementation

### Core Docker Functions

#### `pullImages(images, options)`

- Downloads the required Docker images
- Supports authentication for private registries
- Displays progress with a spinner
- Handles platform-specific image requirements

#### `buildImage(imageName, version, dockerfile)`

- Builds a custom Docker image if needed
- Manages image versioning and tagging
- Cleans up old images and containers
- Reports build progress

#### `runImage(image, args, options, debug)`

- Runs a Docker container with specified arguments
- Manages container lifecycle
- Sets up port mappings and volume mounts
- Returns container information (e.g., IP address)

### Selenoid Implementation

Selenoid is used to manage browser containers for Selenium WebDriver tests:

1. **Configuration Generation**:

   - `createSelenoidConfig()`: Creates configuration for Selenoid
   - Maps browser names and versions to Docker images
   - Supports custom Docker images and browser configurations

2. **Container Orchestration**:

   - `startSelenoidContainer()`: Starts the Selenoid container
   - Mounts Docker socket and configuration directory
   - Sets up port mapping for communication
   - Manages container lifecycle

3. **Standalone Mode**:

   - `startSelenoidStandalone()`: Runs Selenoid without Docker
   - Downloads Selenoid binary if needed
   - Configures browsers for local execution
   - Supports custom WebDriver executables

4. **Docker Networking**:
   - Sets up networking between Selenoid and browser containers
   - Manages port exposing for communication
   - Handles Docker-in-Docker scenarios

### Playwright Implementation

Playwright uses a different container model:

1. **Container Configuration**:

   - `startPlaywrightContainer()`: Starts a Playwright container
   - Configures browser type (chromium, firefox, webkit)
   - Sets up port mapping for WebSocket communication

2. **Trace Collection**:

   - Mounts volumes for collecting traces and logs
   - Supports debugging and error analysis

3. **WebSocket Communication**:
   - Sets up WebSocket endpoint for browser control
   - Manages port allocation and exposure
   - Handles Docker-in-Docker networking

## Configuration Options

The Docker integration can be configured with several options:

### Global Docker Options

- `useDocker`: Whether to use Docker for browser isolation
- `dockerImage`: Custom Docker image for Selenoid
- `pullImages`: Whether to pull images or use local ones
- `dockerAuth`: Authentication for private Docker registries
- `dockerImagePlatform`: Platform specification for Docker images

### Browser-specific Docker Options

- `browserName`: Browser to use
- `dockerImage`: Custom Docker image for the specific browser
- `seleniumCapabilities.browserVersion`: Version of the browser
- `limit`: Number of parallel sessions

## Working with Docker-in-Docker

Creevey has special handling for Docker-in-Docker environments:

- Detects whether running inside a Docker container
- Resolves host addresses correctly for container communication
- Mounts Docker socket for container management
- Handles networking between containers

## Error Handling

The Docker integration includes robust error handling:

- Container startup failures are detected and reported
- Image pull and build errors are caught and displayed
- Network communication errors are handled gracefully
- Resources are properly cleaned up on shutdown

## Extension Points

The Docker integration can be extended in several ways:

1. **Custom Docker Images**: Specify custom images for browsers
2. **Custom Selenoid Configuration**: Configure Selenoid behavior
3. **Standalone Mode**: Run without Docker in environments where it's unavailable
4. **Private Registries**: Configure authentication for private Docker registries

## Usage in Test Execution

The Docker integration is used during test execution to:

1. Set up isolated browser environments
2. Ensure consistent browser versions
3. Provide clean environments for each test run
4. Enable cross-browser testing
5. Support CI/CD pipeline integration
