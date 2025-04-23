# Data Flow Diagram for Creevey

This document illustrates the flow of data through the Creevey system, from test initialization to results visualization.

## High-Level Data Flow

```mermaid
graph LR
    %% Main Data Sources/Sinks
    Stories["Stories<br>(Storybook)"]
    Tests["Test Files"]
    Browsers["Browser<br>Instances"]
    Images["Image<br>Repository"]
    UI["UI Client"]

    %% Processes
    StoriesLoader["Stories<br>Loader"]
    TestGen["Test<br>Generator"]
    TestRunner["Test<br>Runner"]
    WebDriver["WebDriver<br>Integration"]
    ImageCompare["Image<br>Comparison"]

    %% Data Flow
    Stories --> StoriesLoader
    Tests --> StoriesLoader
    StoriesLoader --> TestGen
    TestGen --> TestRunner
    TestRunner --> WebDriver
    WebDriver --> Browsers
    Browsers --> WebDriver
    WebDriver --> ImageCompare
    Images --> ImageCompare
    ImageCompare --> Images
    ImageCompare --> UI
    UI --> TestRunner

    %% Styling
    classDef source fill:#bbdefb,stroke:#1976d2,color:black
    classDef process fill:#c8e6c9,stroke:#388e3c,color:black
    classDef sink fill:#ffe0b2,stroke:#e65100,color:black

    class Stories,Tests,Images source
    class StoriesLoader,TestGen,TestRunner,WebDriver,ImageCompare process
    class Browsers,UI sink
```

## Detailed Data Flow

```mermaid
graph TD
    %% Story Data Flow
    Storybook["Storybook"]
    StoryProvider["Story Provider"]
    WebDriver1["WebDriver"]
    TestFiles["Test Files<br>(Optional)"]
    TestDatabase["Test Database<br>(In-Memory)"]

    %% Test Execution Flow
    TestRunner["Test Runner"]
    Workers["Worker<br>Processes"]
    WebDriver2["WebDriver<br>Interface"]
    Browser["Browser<br>Instance"]
    Story["Story<br>in Browser"]
    Screenshot["Screenshot<br>Capture"]

    %% Image Processing Flow
    ImageRepo["Image Repository<br>(File System)"]
    Baseline["Baseline<br>Images"]
    Actual["Actual<br>Screenshot"]
    Comparison["Image<br>Comparison"]
    DiffGen["Difference<br>Generation"]
    Results["Test Results<br>Database"]

    %% UI Data Flow
    WebSocket["WebSocket<br>Server"]
    UIClient["UI Client"]
    ResultsView["Results<br>Visualization"]
    TestControls["Test<br>Controls"]
    TreeView["Test Tree<br>View"]

    %% Flow Connections - Story Discovery
    Storybook --> WebDriver1
    WebDriver1 --> StoryProvider
    TestFiles --> StoryProvider
    StoryProvider --> TestDatabase

    %% Flow Connections - Test Execution
    TestDatabase --> TestRunner
    TestRunner --> Workers
    Workers --> WebDriver2
    WebDriver2 --> Browser
    Browser --> Story
    Story --> Screenshot

    %% Flow Connections - Image Processing
    Screenshot --> Actual
    ImageRepo --> Baseline
    Actual --> Comparison
    Baseline --> Comparison
    Comparison --> DiffGen
    DiffGen --> Results
    Results --> ImageRepo

    %% Flow Connections - UI
    Results --> WebSocket
    WebSocket --> UIClient
    UIClient --> ResultsView
    UIClient --> TestControls
    UIClient --> TreeView
    TestControls --> TestRunner

    %% Styling
    classDef input fill:#bbdefb,stroke:#1976d2,color:black
    classDef process fill:#c8e6c9,stroke:#388e3c,color:black
    classDef storage fill:#ffe0b2,stroke:#e65100,color:black
    classDef output fill:#ffcdd2,stroke:#d32f2f,color:black

    class Storybook,TestFiles,ImageRepo input
    class StoryProvider,TestRunner,Workers,WebDriver1,WebDriver2,Browser,Story,Screenshot,Comparison,DiffGen,WebSocket process
    class TestDatabase,Baseline,Actual,Results storage
    class UIClient,ResultsView,TestControls,TreeView output
```

## Image Data Flow

```mermaid
flowchart TD
    %% Image Sources
    Baseline["Baseline Image<br>(File System)"]
    Screenshot["Screenshot<br>(Browser)"]

    %% Image Processing
    Load["Load Images"]
    Compare["Compare Images<br>(pixelmatch/odiff)"]
    Diff["Generate Diff<br>Image"]

    %% Results Storage
    TestResult["Test Result<br>Object"]
    FileSystem["File System<br>Storage"]

    %% UI Display
    Encode["Base64 Encode<br>Images"]
    WebSocket["WebSocket<br>Transport"]
    UIRender["UI Rendering<br>Component"]

    %% Flow Connections
    Baseline --> Load
    Screenshot --> Load
    Load --> Compare
    Compare --> Diff
    Compare --> TestResult
    Diff --> TestResult
    TestResult --> FileSystem
    TestResult --> Encode
    Encode --> WebSocket
    WebSocket --> UIRender

    %% Styling
    classDef source fill:#bbdefb,stroke:#1976d2,color:black
    classDef process fill:#c8e6c9,stroke:#388e3c,color:black
    classDef storage fill:#ffe0b2,stroke:#e65100,color:black
    classDef ui fill:#ffcdd2,stroke:#d32f2f,color:black

    class Baseline,Screenshot source
    class Load,Compare,Diff,Encode process
    class TestResult,FileSystem storage
    class WebSocket,UIRender ui
```

## Test Result Data Flow

```mermaid
graph TD
    %% Test Execution
    Worker["Worker Process"]
    TestExec["Test Execution"]

    %% Result Processing
    ResultObj["Test Result<br>Object"]
    TestDB["Test Results<br>Database"]

    %% Status Updates
    WSServer["WebSocket<br>Server"]
    Client["UI Client"]

    %% Result Storage
    FileSystem["File System<br>(Images & Reports)"]
    ReportGen["Report<br>Generator"]

    %% Flow Connections
    Worker --> TestExec
    TestExec --> ResultObj
    ResultObj --> TestDB
    ResultObj --> WSServer
    ResultObj --> FileSystem
    TestDB --> ReportGen
    WSServer --> Client
    ReportGen --> FileSystem

    %% Styling
    classDef process fill:#bbdefb,stroke:#1976d2,color:black
    classDef data fill:#c8e6c9,stroke:#388e3c,color:black
    classDef storage fill:#ffe0b2,stroke:#e65100,color:black
    classDef output fill:#ffcdd2,stroke:#d32f2f,color:black

    class Worker,TestExec,WSServer,ReportGen process
    class ResultObj,TestDB data
    class FileSystem storage
    class Client output
```

## WebSocket Communication Data Flow

```mermaid
sequenceDiagram
    participant Client as UI Client
    participant Server as WebSocket Server
    participant TestDB as Test Database
    participant Runner as Test Runner

    %% Initial Status
    Client->>Server: Request status
    Server->>TestDB: Get current status
    TestDB->>Server: Return status data
    Server->>Client: Send status data

    %% Start Tests
    Client->>Server: Start tests command
    Server->>Runner: Request to start tests
    Runner->>TestDB: Initialize test state

    %% Test Updates
    loop For each test update
        Runner->>TestDB: Update test result
        TestDB->>Server: Notify of update
        Server->>Client: Send test update
    end

    %% Approve Image
    Client->>Server: Approve image request
    Server->>TestDB: Update approval status
    Server->>FileSystem: Update baseline image
    TestDB->>Server: Confirm approval
    Server->>Client: Send updated status
```

## Configuration Data Flow

```mermaid
graph TD
    %% Configuration Sources
    ConfigFile["Configuration<br>File"]
    CLIOptions["Command Line<br>Options"]
    Defaults["Default<br>Configuration"]

    %% Configuration Processing
    ConfigLoader["Configuration<br>Loader"]
    MergedConfig["Merged<br>Configuration"]

    %% Configuration Consumers
    Server["Creevey<br>Server"]
    Docker["Docker<br>Integration"]
    WebDriver["WebDriver<br>Integration"]
    StoriesProvider["Stories<br>Provider"]

    %% Flow Connections
    ConfigFile --> ConfigLoader
    CLIOptions --> ConfigLoader
    Defaults --> ConfigLoader
    ConfigLoader --> MergedConfig
    MergedConfig --> Server
    MergedConfig --> Docker
    MergedConfig --> WebDriver
    MergedConfig --> StoriesProvider

    %% Styling
    classDef source fill:#bbdefb,stroke:#1976d2,color:black
    classDef process fill:#c8e6c9,stroke:#388e3c,color:black
    classDef config fill:#ffe0b2,stroke:#e65100,color:black
    classDef consumer fill:#ffcdd2,stroke:#d32f2f,color:black

    class ConfigFile,CLIOptions,Defaults source
    class ConfigLoader process
    class MergedConfig config
    class Server,Docker,WebDriver,StoriesProvider consumer
```

## Key Data Entities

### Story Data Structure

```typescript
interface StoryData {
  id: string;
  title: string;
  component: any;
  parameters: {
    creevey?: CreeveyStoryParams;
    [key: string]: any;
  };
}
```

### Test Data Structure

```typescript
interface TestData {
  id: string;
  storyPath: string[];
  browser: string;
  testName?: string;
  storyId: string;
  skip?: boolean | string;
  retries?: number;
  status?: TestStatus;
  results?: TestResult[];
  approved?: Record<string, number> | null;
}
```

### Test Result Structure

```typescript
interface TestResult {
  status: 'failed' | 'success';
  retries: number;
  images?: Record<
    string,
    {
      actual: string;
      expect?: string;
      diff?: string;
      error?: string;
    }
  >;
  error?: string;
  duration?: number;
  attachments?: string[];
  sessionId?: string;
  browserName?: string;
  workerId?: number;
}
```

## Data Flow Phases

1. **Configuration Phase**:

   - Load configuration from files and CLI
   - Merge with defaults
   - Distribute to components

2. **Story Discovery Phase**:

   - Load stories from Storybook
   - Load test files (optional)
   - Merge into test database

3. **Test Execution Phase**:

   - Distribute tests to workers
   - Control browsers via WebDriver
   - Capture screenshots

4. **Image Processing Phase**:

   - Compare actual vs baseline
   - Generate difference images
   - Update test results

5. **Reporting Phase**:
   - Send real-time updates to UI
   - Generate static reports
   - Update file system

## Related Diagrams

This data flow diagram should be viewed alongside:

- System Architecture Overview
- Test Execution Flow Diagram
- WebDriver Integration Architecture
- UI Architecture Diagram
