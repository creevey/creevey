# Implementation Plan for Creevey

## Completed Documentation Tasks

- [x] Analysis of Creevey codebase architecture
- [x] Planning of documentation structure
- [x] Creation of all required architecture diagrams:
  - [x] Comprehensive architecture diagram
  - [x] System overview diagram
  - [x] Test execution flow diagram
  - [x] WebDriver integration diagram
  - [x] Storybook integration diagram
  - [x] UI architecture diagram
  - [x] Docker integration diagram
  - [x] Data flow diagram
  - [x] Technology stack diagram
- [x] Development Guide Creation
  - [x] Setup instructions
  - [x] Core concepts explanation
  - [x] API documentation
  - [x] Configuration options
  - [x] Example workflows
  - [x] Best practices
- [x] Performance Optimization Guide
  - [x] Configuration tuning strategies
  - [x] Browser optimization techniques
  - [x] Test selection strategies
  - [x] Parallelization techniques
  - [x] Resource management approaches
  - [x] CI optimization strategies
- [x] CI Integration Guide
  - [x] GitHub Actions configuration
  - [x] GitLab CI configuration
  - [x] CircleCI configuration
  - [x] Jenkins configuration
  - [x] Azure DevOps configuration
- [x] Advanced Examples Documentation
  - [x] Complex interactions examples
  - [x] Animation testing examples
  - [x] Parameterized testing examples
  - [x] Design system testing examples
  - [x] Cross-browser testing examples

## Current Implementation Tasks

### Phase 1: Test Data Management Refactoring (1-2 weeks)

1. Create the TestsManager class with basic structure and interfaces
2. Implement core functionality for test data operations
   - Loading tests from report
   - Merging tests from different sources
   - Saving tests to JSON
   - Updating tests incrementally
3. Refactor Runner class to use TestsManager
4. Update dependent components (master.ts, start.ts)
5. Add tests for the new implementation
6. Ensure backward compatibility

### Phase 2: Technical Debt Reduction (1 week)

1. Update outdated dependencies
2. Refactor WebDriver integration for better maintainability
3. Improve error handling throughout the codebase
4. Enhance test coverage for core components
5. Standardize configuration options

## Future Enhancement Tasks

### Phase 3: Performance Optimization (1-2 weeks)

1. Research and design optimal worker management strategy
2. Implement improved thread pooling for parallel test execution
3. Add test sharding capabilities for CI environments
4. Optimize image processing for faster comparisons
5. Implement test selection based on file changes

### Phase 4: Error Reporting Enhancement (1-2 weeks)

1. Design enhanced error reporting format
2. Implement structured error logging system
3. Add visual error indicators to UI Runner
4. Create error categories for better troubleshooting
5. Implement error aggregation for test runs

### Phase 5: Advanced Image Comparison (2-3 weeks)

1. Research AI-assisted image comparison options
2. Implement better difference highlighting
3. Add support for ignoring dynamic content
4. Create advanced threshold configuration options
5. Optimize comparison algorithms for speed

### Phase 6: UI Enhancement (2 weeks)

1. Add more visualization options for test results
2. Implement better filtering and search functionality
3. Create dashboard for test metrics
4. Improve responsiveness for large test suites
5. Add advanced reporting capabilities

## Implementation Constraints

- Maintain backward compatibility with existing configurations
- Ensure cross-platform compatibility (Windows, macOS, Linux)
- Keep performance overhead minimal
- Follow TypeScript best practices
- Add comprehensive tests for new features

## Milestones and Timeline

1. **Milestone 1: Test Data Management Refactoring** - End of Month 1

   - TestsManager class creation
   - Core functionality implementation
   - Refactored Runner class
   - Dependent components update
   - New implementation tests
   - Backward compatibility

2. **Milestone 2: Technical Debt Reduction** - Mid-Month 2

   - Updated dependencies
   - Refactored WebDriver integration
   - Improved error handling
   - Enhanced test coverage
   - Standardized configuration

3. **Milestone 3: Performance Optimization** - End of Month 2 (Future)

   - Improved test parallelization
   - Optimized image processing
   - Test sharding implementation

4. **Milestone 4: Error Reporting Enhancement** - Mid-Month 3 (Future)

   - Enhanced error format
   - Structured error logs
   - Visual error indicators

5. **Milestone 5: Advanced Image Comparison** - End of Month 3 (Future)

   - Better difference highlighting
   - Dynamic content ignoring
   - Optimized comparison algorithms

6. **Milestone 6: UI Enhancement** - Mid-Month 4 (Future)
   - Enhanced visualization
   - Improved filtering
   - Test metrics dashboard

## Resources Required

- Access to Creevey codebase
- Development environment with Node.js and TypeScript
- Multiple browsers for cross-browser testing
- Docker for container testing
- CI environment for integration testing

## Implementation Approach

### Development Methodology

- Feature-branch workflow
- Test-driven development where appropriate
- Code reviews for all changes
- Continuous integration for automated testing
- Regular documentation updates

### Quality Assurance

- Unit tests for new functionality
- Integration tests for system components
- End-to-end tests for critical workflows
- Performance benchmarks for optimization work
- Cross-browser compatibility testing

## Success Criteria

- Performance improvements are measurable and significant
- Error reporting provides actionable information
- New features maintain backward compatibility
- Documentation is updated to reflect changes
- All tests pass consistently across platforms
- Code quality meets established standards

## Test Data Management Refactoring - Detailed Plan

### Background

Currently, the runner directly updates tests data and results inside its methods. This creates a tight coupling between test execution and test data management. Refactoring this into a separate class will improve code organization, maintainability, and make future enhancements easier.

### Design

#### TestsManager Class Structure

```typescript
// src/server/testsFiles/testsManager.ts
import { EventEmitter } from 'events';
import { ServerTest, TestData, TestMeta, TestResult, TestStatus, CreeveyUpdate, ApprovePayload } from '../../types.js';

export interface TestsManagerEvents {
  update: (update: CreeveyUpdate) => void;
}

export class TestsManager extends EventEmitter {
  private tests: Partial<Record<string, ServerTest>> = {};

  // Get a copy of all tests
  public getAllTests(): Partial<Record<string, ServerTest>> {
    return { ...this.tests };
  }

  // Get test data as status object
  public getTestsData(): Partial<Record<string, TestData>> {
    // Implementation
  }

  // Load tests from report
  public loadTestsFromReport(reportPath: string): Partial<Record<string, TestData>> {
    // Implementation
  }

  // Merge tests from stories with tests from report
  public mergeTests(testsFromStories: Partial<Record<string, ServerTest>>): void {
    // Implementation
  }

  // Update tests with incremental changes
  public updateTests(testsDiff: Partial<Record<string, ServerTest>>): void {
    // Implementation
  }

  // Update test result
  public updateTestResult(id: string, status: TestStatus, result?: TestResult): void {
    // Implementation
  }

  // Save tests to JSON
  public saveTestsToJson(reportDir: string): void {
    // Implementation
  }

  // Approve test
  public async approveTest(payload: ApprovePayload): Promise<void> {
    // Implementation
  }

  // Approve all tests
  public async approveAllTests(): Promise<void> {
    // Implementation
  }
}
```

### Implementation Steps

1. **Create TestsManager Structure (Days 1-2)**

   - Create the base class with its interface
   - Implement initial data storage and event emission

2. **Core Data Operations (Days 3-5)**

   - Implement loading tests from report
   - Implement test data merging
   - Implement saving tests to JSON
   - Implement incremental test updates
   - Add test result updating

3. **Refactor Runner (Days 6-8)**

   - Remove direct test data handling
   - Update Runner to reference TestsManager
   - Ensure events are properly propagated
   - Fix test execution handling

4. **Update Dependent Components (Days 9-10)**

   - Refactor master.ts to use TestsManager
   - Update start.ts for report generation
   - Fix any other components with direct test access

5. **Testing (Days 11-12)**

   - Add unit tests for TestsManager
   - Test full execution flow
   - Validate backward compatibility

6. **Documentation and Cleanup (Days 13-14)**
   - Document the new API
   - Clean up any remaining issues
   - Update architecture documentation

### Affected Files

- `src/server/testsFiles/testsManager.ts` (New file)
- `src/server/testsFiles/index.ts` (New file)
- `src/server/master/runner.ts` (Significant changes)
- `src/server/master/master.ts` (Moderate changes)
- `src/server/master/start.ts` (Minor changes)
- `src/server/stories.ts` (Move functions)
- `src/server/utils.ts` (Move functions)

### Backward Compatibility

This refactoring will maintain the same external API, ensuring that all existing functionality continues to work without changes to consumer code. The event system will be preserved, and the data structure will remain the same.

### Testing Strategy

- Unit tests for TestsManager methods
- Integration tests for Runner and TestsManager interaction
- End-to-end tests for the full execution flow
- Regression tests to ensure existing functionality works

### Risks and Mitigation

- **Risk**: Regression in test execution behavior
  - **Mitigation**: Comprehensive test coverage and careful refactoring
- **Risk**: Performance degradation

  - **Mitigation**: Benchmark before and after the changes

- **Risk**: Event handling issues
  - **Mitigation**: Thorough testing of all event paths

### Success Criteria

- All existing tests continue to pass
- Code is more maintainable and organized
- The Runner class is simpler and more focused
- Test data operations are centralized and consistent
