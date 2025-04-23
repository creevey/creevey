# Storybook Integration Architecture

This document illustrates how Creevey integrates with Storybook as an addon and how it discovers, loads, and tests stories.

## Storybook Addon Architecture

```mermaid
graph TD
    %% Main Components
    Storybook["Storybook"]
    Addon["Creevey Addon"]
    Channel["Storybook Channel"]
    Server["Creevey Server"]

    %% Addon Components
    Register["Addon Registration"]
    Panel["Addon Panel"]
    Decorators["Story Decorators"]
    Toolbar["Toolbar Items"]

    %% Server Components
    StoriesLoader["Stories Loader"]
    TestGen["Test Generator"]

    %% Connections
    Storybook --> Register
    Register --> Addon

    Addon --> Panel
    Addon --> Decorators
    Addon --> Toolbar

    Panel <--> Channel
    Decorators <--> Channel
    Toolbar <--> Channel

    Channel <--> Server
    Server --> StoriesLoader
    Server --> TestGen

    %% Styling
    classDef storybook fill:#ff8a65,stroke:#d84315,color:black
    classDef addon fill:#81c784,stroke:#388e3c,color:black
    classDef channel fill:#64b5f6,stroke:#1976d2,color:black
    classDef server fill:#9575cd,stroke:#512da8,color:black

    class Storybook storybook
    class Addon,Register,Panel,Decorators,Toolbar addon
    class Channel channel
    class Server,StoriesLoader,TestGen server
```

## Story Discovery and Loading

```mermaid
sequenceDiagram
    participant Creevey as Creevey Server
    participant Provider as Story Provider
    participant Storybook as Storybook
    participant Tests as Test Files

    alt Browser Stories Provider
        Creevey->>Storybook: Request stories via WebDriver
        Storybook->>Creevey: Return stories
        Creevey->>Creevey: Generate tests from story parameters
    else Hybrid Stories Provider
        Creevey->>Storybook: Request stories via WebDriver
        Storybook->>Creevey: Return stories
        Creevey->>Tests: Load test files
        Tests->>Creevey: Return test definitions
        Creevey->>Creevey: Merge stories with test definitions
    end

    Creevey->>Creevey: Create test objects
    Creevey->>Creevey: Watch for changes in stories/tests
```

## Story Provider Architecture

```mermaid
classDiagram
    class StoriesProvider {
        <<interface>>
        (config, storiesListener, webdriver) => Promise<StoriesRaw>
        +providerName?: string
    }

    class BrowserStoriesProvider {
        +providerName: "browser"
        -loadStoriesFromBrowser(webdriver)
        +extract CSF stories
    }

    class HybridStoriesProvider {
        +providerName: "hybrid"
        -loadStoriesFromBrowser(webdriver)
        -loadTestsFromFiles(config)
        +merge stories and tests
    }

    StoriesProvider <|.. BrowserStoriesProvider
    StoriesProvider <|.. HybridStoriesProvider
```

## Communication Flow Between Storybook and Creevey

```mermaid
sequenceDiagram
    participant Client as Creevey UI
    participant Server as Creevey Server
    participant Browser as Browser (WebDriver)
    participant Storybook as Storybook
    participant Addon as Creevey Addon

    %% Story Discovery
    Server->>Browser: Navigate to Storybook
    Browser->>Storybook: Load Storybook
    Storybook->>Addon: Initialize addon
    Addon->>Storybook: Register with Storybook

    %% Story Loading
    Server->>Browser: Execute script to get stories
    Browser->>Storybook: Get all stories
    Storybook->>Browser: Return stories data
    Browser->>Server: Return stories

    %% Test Execution
    Client->>Server: Request to run tests
    Server->>Browser: Navigate to specific story
    Browser->>Storybook: Load story
    Server->>Browser: Wait for story to render

    %% Interactions via Addon
    Server->>Browser: Execute test interactions
    Browser->>Addon: Interact with story
    Addon->>Storybook: Update story state
    Storybook->>Browser: Render updated story

    %% Screenshot Capture
    Server->>Browser: Capture screenshot
    Browser->>Server: Return screenshot
    Server->>Client: Update test status
```

## Test Definition Methods

Creevey supports multiple ways to define tests:

```mermaid
graph TD
    Tests["Test Definitions"]

    Tests --> InlineParams["Inline Parameters<br>in Story"]
    Tests --> SeparateFiles["Separate Test Files"]
    Tests --> CSFTests["CSF Tests<br>(play function)"]

    InlineParams --> IP["story = {<br>creevey: {<br>  tests: { ... }<br>}<br>}"]
    SeparateFiles --> SF["kind('Component')<br>.story('Example')<br>.test('name', async => { ... })"]
    CSFTests --> CSF["export const Story = {<br>  play: async ({ canvasElement }) => { ... }<br>}"]

    style Tests fill:#f5f5f5,stroke:#333,stroke-width:2px
    style InlineParams fill:#bbdefb,stroke:#1976d2
    style SeparateFiles fill:#c8e6c9,stroke:#388e3c
    style CSFTests fill:#ffccbc,stroke:#e64a19
```

## Storybook Addon Component Structure

```mermaid
graph TD
    %% Main Components
    Addon["Creevey Addon"]

    %% Registration Points
    Addon --> Manager["Manager Entry<br>(manager.js)"]
    Addon --> Preview["Preview Entry<br>(preview.js)"]
    Addon --> Preset["Preset Config<br>(preset.js)"]

    %% Manager Components
    Manager --> Panel["Test Panel UI"]
    Manager --> Tools["Toolbar Items"]

    %% Preview Components
    Preview --> Decorators["Story Decorators"]
    Preview --> Parameters["Default Parameters"]

    %% Panel Components
    Panel --> TestList["Test List View"]
    Panel --> Controls["Test Controls"]
    Panel --> Results["Test Results"]
    Panel --> DiffView["Diff Visualization"]

    %% Styling
    classDef main fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef entry fill:#bbdefb,stroke:#1976d2
    classDef ui fill:#c8e6c9,stroke:#388e3c
    classDef preview fill:#ffccbc,stroke:#e64a19

    class Addon main
    class Manager,Preview,Preset entry
    class Panel,Tools ui
    class Decorators,Parameters preview
    class TestList,Controls,Results,DiffView ui
```

## Storybook Parameter Merging

```mermaid
graph TD
    %% Parameters Sources
    Global["Global Parameters<br>(.storybook/preview.js)"]
    Kind["Kind Parameters<br>(Component level)"]
    Story["Story Parameters<br>(Story level)"]
    Test["Test Files<br>(External definitions)"]

    %% Merging Process
    Global --> Merge["Parameter<br>Merging"]
    Kind --> Merge
    Story --> Merge
    Test --> Merge

    %% Result
    Merge --> Final["Final Test Context<br>with Merged Parameters"]

    %% Styling
    classDef source fill:#bbdefb,stroke:#1976d2
    classDef process fill:#f5f5f5,stroke:#333,stroke-width:2px
    classDef result fill:#c8e6c9,stroke:#388e3c

    class Global,Kind,Story,Test source
    class Merge process
    class Final result
```

## Key Integration Points

1. **Addon Registration**

   - Registers with Storybook's addon system
   - Creates UI panels in Storybook

2. **Channel-based Communication**

   - Uses Storybook's channel for communication
   - Listens for story events

3. **Story Discovery**

   - Extracts stories from Storybook
   - Merges with external test definitions

4. **Test Execution**

   - Controls story navigation and rendering
   - Executes test interactions
   - Captures screenshots

5. **Result Visualization**
   - Displays test results in Storybook UI
   - Provides tools for approving/rejecting changes

## Storybook Events Used

Creevey interacts with Storybook through these events:

```
SET_STORIES
SET_CURRENT_STORY
FORCE_REMOUNT
STORY_RENDERED
STORY_ERRORED
STORY_THREW_EXCEPTION
UPDATE_STORY_ARGS
SET_GLOBALS
UPDATE_GLOBALS
```

## Related Diagrams

This Storybook integration diagram should be viewed alongside:

- System Architecture Overview
- Test Execution Flow Diagram
- WebDriver Integration Architecture
- Client-Server Communication Diagram
