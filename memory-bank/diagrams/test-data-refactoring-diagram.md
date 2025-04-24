# Test Data Management Refactoring

This diagram illustrates the planned refactoring of test data management in Creevey. It shows the current architecture and the proposed changes with the new TestsManager class.

## Current Architecture

<mermaid>
classDiagram
    class Runner {
        -tests: Record~string, ServerTest~
        +updateTests(testsDiff)
        +approveAll()
        +approve(payload)
        -handlePoolMessage(message)
        +start(ids)
        +stop()
        +get status(): CreeveyStatus
    }
    
    class Master {
        +master(config, gridUrl): Runner
    }
    
    class Stories {
        +loadTestsFromStories(browsers, provider, update)
        +saveTestsJson(tests, dstPath)
    }
    
    class Utils {
        +tryToLoadTestsData(filename)
        +testsToImages(tests)
    }
    
    Master --> Runner : creates
    Master --> Stories : uses
    Master --> Utils : uses
    Runner --> Stories : uses
    Runner --> Utils : uses
</mermaid>

## Proposed Architecture

<mermaid>
classDiagram
    class TestsManager {
        -tests: Record~string, ServerTest~
        +getAllTests(): Record~string, ServerTest~
        +getTestsData(): Record~string, TestData~
        +loadTestsFromReport(reportPath)
        +mergeTests(testsFromStories)
        +updateTests(testsDiff)
        +updateTestResult(id, status, result)
        +saveTestsToJson(reportDir)
        +approveTest(payload)
        +approveAllTests()
    }
    
    class Runner {
        -testsManager: TestsManager
        -handlePoolMessage(message)
        +start(ids)
        +stop()
        +get status(): CreeveyStatus
    }
    
    class Master {
        +master(config, gridUrl): Runner
    }
    
    class Stories {
        +loadTestsFromStories(browsers, provider, update)
    }
    
    Master --> Runner : creates
    Master --> TestsManager : creates
    Master --> Stories : uses
    Runner --> TestsManager : uses
    TestsManager ..> Utils : uses
</mermaid>

## Data Flow Before Refactoring

<mermaid>
sequenceDiagram
    participant M as Master
    participant R as Runner
    participant S as Stories
    participant U as Utils
    
    M->>U: tryToLoadTestsData(reportPath)
    U-->>M: testsFromReport
    
    M->>R: new Runner(config, gridUrl)
    
    M->>S: loadTestsFromStories(browsers, provider, update)
    S-->>M: tests
    
    M->>M: mergeTests(testsFromReport, tests)
    M->>R: runner.tests = mergedTests
    
    M->>S: saveTestsJson(runner.tests, config.reportDir)
</mermaid>

## Data Flow After Refactoring

<mermaid>
sequenceDiagram
    participant M as Master
    participant TM as TestsManager
    participant R as Runner
    participant S as Stories
    
    M->>TM: new TestsManager()
    M->>R: new Runner(config, gridUrl, testsManager)
    
    M->>TM: loadTestsFromReport(reportPath)
    
    M->>S: loadTestsFromStories(browsers, provider, update)
    S-->>M: testsFromStories
    
    M->>TM: mergeTests(testsFromStories)
    
    M->>TM: saveTestsToJson(config.reportDir)
    
    R->>TM: getTestsData()
    TM-->>R: testsData
</mermaid>

## Benefits of Refactoring

1. **Separation of Concerns**: Test data management is separated from test execution
2. **Improved Maintainability**: Each class has a more focused responsibility
3. **Better Testability**: Easier to write unit tests for each component
4. **Reduced Coupling**: Runner doesn't need to know about data storage details
5. **Centralized Data Management**: All test data operations are in one place
6. **Future Extensibility**: Easier to add new data-related features
