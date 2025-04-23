# Test Execution Flow Diagram

This document illustrates the detailed sequence of test execution in Creevey, from test initiation to result reporting.

## Test Execution Sequence

```mermaid
sequenceDiagram
    participant Client as UI Client
    participant Server as Creevey Server
    participant Worker as Worker Process
    participant Stories as Story Provider
    participant Webdriver as WebDriver
    participant Browser as Browser Instance
    participant Images as Image Comparison
    participant FileSystem as File System

    %% Test Initialization
    Client->>Server: Request to start tests
    Server->>Stories: Load stories
    Stories->>Server: Return stories
    Server->>Server: Generate test cases

    %% Worker Assignment
    Server->>Worker: Spawn worker process
    Worker->>Server: Worker ready
    Server->>Worker: Assign test(s)

    %% Browser Setup
    Worker->>Webdriver: Initialize WebDriver
    Webdriver->>Browser: Launch browser
    Browser->>Webdriver: Browser ready
    Webdriver->>Worker: WebDriver initialized

    %% Test Execution
    Worker->>Browser: Navigate to Storybook URL
    Browser->>Worker: Page loaded
    Worker->>Browser: Set story parameters
    Worker->>Browser: Wait for story to render
    Browser->>Worker: Story rendered

    alt Interactive Test
        Worker->>Browser: Execute test interactions
        Browser->>Worker: Interactions completed
    end

    Worker->>Browser: Capture screenshot
    Browser->>Worker: Return screenshot

    %% Image Comparison
    Worker->>FileSystem: Load baseline image
    FileSystem->>Worker: Return baseline image (if exists)

    alt Baseline exists
        Worker->>Images: Compare screenshots
        Images->>Worker: Comparison result
    else No baseline
        Worker->>Worker: Mark as new baseline
    end

    %% Report Results
    Worker->>Server: Report test result
    Server->>FileSystem: Save results & images
    Server->>Client: Update test status

    %% Clean Up
    alt Continue Testing
        Server->>Worker: Assign next test
    else All Tests Complete
        Server->>Worker: Terminate worker
        Worker->>Webdriver: Close browser
        Webdriver->>Browser: Quit
    end

    Server->>Client: All tests complete
```

## Key Steps in Test Execution

### 1. Test Initialization

- Client requests test execution
- Server loads stories through selected story provider
- Server generates test cases based on stories and configuration

### 2. Worker Assignment

- Server spawns worker processes based on configuration
- Workers report readiness to server
- Server assigns tests to available workers

### 3. Browser Setup

- Worker initializes appropriate WebDriver (Selenium or Playwright)
- WebDriver launches browser instance
- Browser initialization completes

### 4. Test Execution

- Browser navigates to Storybook URL
- Story is loaded with appropriate parameters
- Wait for story to fully render
- Execute any interactive test steps (if defined)
- Capture screenshot of the rendered component

### 5. Image Comparison

- Load baseline image from file system (if exists)
- Compare captured screenshot with baseline
- Generate difference image if needed
- Determine test result (pass/fail/new)

### 6. Result Reporting

- Worker reports test result to server
- Server saves results and images to file system
- Server updates client with test status in real-time

### 7. Clean Up

- Assign next test or terminate worker if done
- Close browser instance when worker is terminated
- Report completion to client

## Parallel Execution Model

Creevey employs a parallel execution model:

```mermaid
graph TB
    Server["Creevey Server"]

    Server --> Worker1["Worker 1"]
    Server --> Worker2["Worker 2"]
    Server --> Worker3["Worker 3"]
    Server --> WorkerN["Worker N..."]

    Worker1 --> Browser1["Browser 1<br>(Chrome)"]
    Worker2 --> Browser2["Browser 2<br>(Firefox)"]
    Worker3 --> Browser3["Browser 3<br>(Safari)"]
    WorkerN --> BrowserN["Browser N..."]

    style Server fill:#f5f5f5,stroke:#333,stroke-width:2px
    style Worker1 fill:#e1f5fe,stroke:#0288d1
    style Worker2 fill:#e1f5fe,stroke:#0288d1
    style Worker3 fill:#e1f5fe,stroke:#0288d1
    style WorkerN fill:#e1f5fe,stroke:#0288d1
    style Browser1 fill:#e8f5e9,stroke:#388e3c
    style Browser2 fill:#fff3e0,stroke:#f57c00
    style Browser3 fill:#f3e5f5,stroke:#7b1fa2
    style BrowserN fill:#e0e0e0,stroke:#616161
```

## Worker Communication Protocol

Workers communicate with the server using a standardized message protocol:

### From Server to Worker

- `{ scope: 'worker', type: 'init', payload: { config, options } }`
- `{ scope: 'test', type: 'start', payload: { id, path, retries } }`
- `{ scope: 'shutdown' }`

### From Worker to Server

- `{ scope: 'worker', type: 'ready' }`
- `{ scope: 'worker', type: 'error', payload: { subtype, error } }`
- `{ scope: 'test', type: 'end', payload: { status, images, error } }`

## Error Handling

```mermaid
graph TD
    Error["Error Occurs"]

    Error --> BrowserErr["Browser Error"]
    Error --> TestErr["Test Error"]
    Error --> WorkerErr["Worker Error"]

    BrowserErr --> RetryBrowser["Retry Browser<br>Initialization"]
    TestErr --> RetryTest["Retry Test<br>(up to maxRetries)"]
    WorkerErr --> RestartWorker["Restart Worker"]

    RetryBrowser --> Success1["Success"]
    RetryBrowser --> Fail1["Failure"]
    RetryTest --> Success2["Success"]
    RetryTest --> Fail2["Failure"]
    RestartWorker --> Success3["Success"]
    RestartWorker --> Fail3["Failure"]

    Fail1 & Fail2 & Fail3 --> Report["Report Error<br>to Server"]
    Report --> Client["Update Client"]

    style Error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    style Success1 fill:#c8e6c9,stroke:#388e3c
    style Success2 fill:#c8e6c9,stroke:#388e3c
    style Success3 fill:#c8e6c9,stroke:#388e3c
    style Fail1 fill:#ffcdd2,stroke:#c62828
    style Fail2 fill:#ffcdd2,stroke:#c62828
    style Fail3 fill:#ffcdd2,stroke:#c62828
```

## Related Diagrams

This execution flow diagram should be viewed alongside:

- System Architecture Overview
- WebDriver Integration Architecture
- Docker Container Management Flow
- Image Comparison Process
- Client-Server Communication Protocol
