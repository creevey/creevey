# UI Architecture Diagram

This document illustrates the React-based UI architecture in Creevey, showing the component hierarchy, state management, and communication patterns.

## UI Component Hierarchy

```mermaid
graph TD
    %% Main Components
    App["CreeveyApp"]

    %% Top-level Components
    App --> CreeveyContext["CreeveyContext<br>Provider"]
    CreeveyContext --> WebSocket["WebSocket<br>Provider"]
    WebSocket --> Layout["Layout"]

    %% Layout Components
    Layout --> Header["Header"]
    Layout --> Sidebar["Sidebar"]
    Layout --> Content["Content"]

    %% Sidebar Components
    Sidebar --> TestTree["TestTree"]
    TestTree --> TreeItem["TreeItem"]
    TreeItem --> TreeFolder["TreeFolder"]
    TreeItem --> TestItem["TestItem"]

    %% Content Components
    Content --> TestView["TestView"]
    TestView --> TestStatus["TestStatus"]
    TestView --> ImagesView["ImagesView"]
    TestView --> Controls["Controls"]

    %% Images View Components
    ImagesView --> SideBySide["SideBySide<br>View"]
    ImagesView --> SwapView["Swap<br>View"]
    ImagesView --> SlideView["Slide<br>View"]
    ImagesView --> BlendView["Blend<br>View"]

    %% Styling
    classDef main fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef provider fill:#bbdefb,stroke:#1976d2,color:black
    classDef layout fill:#c8e6c9,stroke:#388e3c,color:black
    classDef sidebar fill:#ffe0b2,stroke:#e65100,color:black
    classDef content fill:#e1bee7,stroke:#8e24aa,color:black
    classDef images fill:#ffcdd2,stroke:#d32f2f,color:black

    class App main
    class CreeveyContext,WebSocket provider
    class Layout,Header,Sidebar,Content layout
    class TestTree,TreeItem,TreeFolder,TestItem sidebar
    class TestView,TestStatus,ImagesView,Controls content
    class SideBySide,SwapView,SlideView,BlendView images
```

## State Management Flow

```mermaid
graph TD
    %% State Components
    WebSocket["WebSocket<br>Connection"]
    ServerState["Server State"]
    UIState["UI State"]

    %% State Management
    Context["CreeveyContext<br>(React Context)"]
    Reducers["Reducers<br>(w/ Immer)"]
    Actions["Action<br>Creators"]

    %% Data Flow
    WebSocket --> |"Events"| Context
    Context --> |"State"| UIComponents["UI Components"]
    UIComponents --> |"Actions"| Actions
    Actions --> |"Dispatch"| Reducers
    Reducers --> |"Update"| Context
    Context --> |"Commands"| WebSocket

    %% Server State
    WebSocket --> |"Updates"| ServerState
    ServerState --> |"Merged into"| Context

    %% Styling
    classDef connection fill:#bbdefb,stroke:#1976d2,color:black
    classDef state fill:#c8e6c9,stroke:#388e3c,color:black
    classDef management fill:#ffe0b2,stroke:#e65100,color:black
    classDef components fill:#e1bee7,stroke:#8e24aa,color:black

    class WebSocket connection
    class ServerState,UIState state
    class Context,Reducers,Actions management
    class UIComponents components
```

## WebSocket Communication Sequence

```mermaid
sequenceDiagram
    participant Client as UI Client
    participant WebSocket as WebSocket Connection
    participant Server as Creevey Server

    %% Initial Connection
    Client->>WebSocket: Establish connection
    WebSocket->>Server: Connect
    Server->>WebSocket: Send initial state
    WebSocket->>Client: Update state

    %% Status Request
    Client->>WebSocket: Request status
    WebSocket->>Server: Status request
    Server->>WebSocket: Send status
    WebSocket->>Client: Update status

    %% Start Tests
    Client->>WebSocket: Start tests
    WebSocket->>Server: Start request
    Server->>WebSocket: Acknowledge start
    WebSocket->>Client: Update running status

    %% Test Updates
    loop For each test update
        Server->>WebSocket: Test status update
        WebSocket->>Client: Update test state
    end

    %% Approve Image
    Client->>WebSocket: Approve image
    WebSocket->>Server: Approve request
    Server->>WebSocket: Approval confirmed
    WebSocket->>Client: Update approval status
```

## Image Comparison Visualization

```mermaid
graph TD
    %% Main Component
    ImagesView["ImagesView"]

    %% View Modes
    ImagesView --> ViewMode["View Mode<br>Selection"]
    ViewMode --> SideBySide["Side-by-Side"]
    ViewMode --> Swap["Swap"]
    ViewMode --> Slide["Slide"]
    ViewMode --> Blend["Blend"]

    %% Images
    ImagesView --> Images["Image Data"]
    Images --> Expected["Expected<br>Image"]
    Images --> Actual["Actual<br>Image"]
    Images --> Diff["Difference<br>Image"]

    %% Controls
    ImagesView --> Controls["Visualization<br>Controls"]
    Controls --> Opacity["Opacity<br>Slider"]
    Controls --> Scale["Scale<br>Control"]
    Controls --> Compare["Comparison<br>Options"]

    %% Styling
    classDef main fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef mode fill:#bbdefb,stroke:#1976d2,color:black
    classDef image fill:#c8e6c9,stroke:#388e3c,color:black
    classDef control fill:#ffe0b2,stroke:#e65100,color:black

    class ImagesView main
    class ViewMode,SideBySide,Swap,Slide,Blend mode
    class Images,Expected,Actual,Diff image
    class Controls,Opacity,Scale,Compare control
```

## Test Tree Implementation

```mermaid
graph TD
    %% Tree Components
    TestTree["TestTree"]

    %% Tree Structure
    TestTree --> TreeState["Tree State"]
    TreeState --> Selection["Selection<br>State"]
    TreeState --> Expansion["Expansion<br>State"]
    TreeState --> Filtering["Filtering<br>State"]

    %% Tree Items
    TestTree --> TopLevel["Top-Level<br>Items"]
    TopLevel --> FolderItems["Folder<br>Items"]
    TopLevel --> TestItems["Test<br>Items"]

    %% Checkbox Behavior
    TestTree --> CheckboxLogic["Checkbox<br>Logic"]
    CheckboxLogic --> CheckAll["Check All"]
    CheckboxLogic --> IndeterminateState["Indeterminate<br>State"]
    CheckboxLogic --> Propagation["State<br>Propagation"]

    %% Styling
    classDef main fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef state fill:#bbdefb,stroke:#1976d2,color:black
    classDef items fill:#c8e6c9,stroke:#388e3c,color:black
    classDef logic fill:#ffe0b2,stroke:#e65100,color:black

    class TestTree main
    class TreeState,Selection,Expansion,Filtering state
    class TopLevel,FolderItems,TestItems items
    class CheckboxLogic,CheckAll,IndeterminateState,Propagation logic
```

## UI Context Structure

```mermaid
classDiagram
    class CreeveyContext {
        +WebSocket connection
        +tests: Record<string, TestData>
        +selection: string[]
        +uiOptions: UiOptions
        +isRunning: boolean
        +browsers: string[]
        +subscribe(handler)
        +dispatch(action)
    }

    class TestData {
        +id: string
        +storyPath: string[]
        +browser: string
        +status: TestStatus
        +results: TestResult[]
        +approved: Record<string, number>
    }

    class TestResult {
        +status: 'failed' | 'success'
        +retries: number
        +images: Record<string, Images>
        +error?: string
    }

    class Images {
        +actual: string
        +expect?: string
        +diff?: string
        +error?: string
    }

    class UiOptions {
        +viewMode: ImagesViewMode
        +zoom: number
        +showOnly: string
        +invertColors: boolean
    }

    CreeveyContext --> TestData : contains
    TestData --> TestResult : contains
    TestResult --> Images : contains
    CreeveyContext --> UiOptions : contains
```

## UI Features Implementation

```mermaid
graph TD
    %% Feature Areas
    Features["UI Feature Areas"]

    %% Test Management
    Features --> TestMgmt["Test Management"]
    TestMgmt --> Selection["Test Selection"]
    TestMgmt --> Filtering["Test Filtering"]
    TestMgmt --> Running["Test Execution"]

    %% Image Management
    Features --> ImageMgmt["Image Management"]
    ImageMgmt --> Visualization["Visualization<br>Modes"]
    ImageMgmt --> Approval["Image<br>Approval"]
    ImageMgmt --> Inspection["Difference<br>Inspection"]

    %% User Interface
    Features --> Interface["User Interface"]
    Interface --> Layout["Responsive<br>Layout"]
    Interface --> Theme["Themeing"]
    Interface --> Accessibility["Accessibility"]

    %% State Persistence
    Features --> Persistence["State Persistence"]
    Persistence --> LocalStorage["Local Storage"]
    Persistence --> URLState["URL State"]

    %% Styling
    classDef feature fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef area fill:#bbdefb,stroke:#1976d2,color:black
    classDef specific fill:#c8e6c9,stroke:#388e3c,color:black

    class Features feature
    class TestMgmt,ImageMgmt,Interface,Persistence area
    class Selection,Filtering,Running,Visualization,Approval,Inspection,Layout,Theme,Accessibility,LocalStorage,URLState specific
```

## Integration with Creevey Server

The UI integrates with the Creevey server through a WebSocket connection, enabling real-time updates and control of the test execution process. Key integration points include:

1. **State Synchronization**:

   - Server sends test status updates in real time
   - UI reflects the current state of tests, including results and images

2. **Command Execution**:

   - UI sends commands to start/stop tests
   - UI can approve test results

3. **Image Management**:
   - Server sends image data (base64 encoded)
   - UI provides visualization tools for comparing images

## Technology Stack

The UI is built with the following technologies:

- **Framework**: React
- **State Management**: React Context + Immer
- **Styling**: CSS modules
- **Communication**: WebSockets
- **Image Processing**: Canvas-based image comparison visualization
- **UI Components**: Custom React components

## Related Diagrams

This UI architecture diagram should be viewed alongside:

- System Architecture Overview
- Test Execution Flow Diagram
- WebSocket Communication Protocol
