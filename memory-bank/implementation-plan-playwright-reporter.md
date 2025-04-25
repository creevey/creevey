# Implementation Plan: Playwright Compatible Reporter

## Overview

Create a standalone Playwright-compatible reporter that integrates with Creevey's functionality. This reporter will:

1. Collect test results and screenshots from Playwright tests
2. Store images in Creevey's report directory
3. Convert test results to Creevey test data format
4. Start Creevey server API to enable real-time updates
5. Save test results at the end of test execution

## Implementation Strategy

### 1. Create Reporter Structure

Create a new module that implements Playwright's Reporter interface. This should be a stand-alone module that can be exported from the Creevey package.

```typescript
// src/playwright-reporter/index.ts
import type { Reporter, FullConfig, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import path from 'path';
import { TestsManager } from '../server/master/testsManager.js';
import { copyStatics } from '../server/master/utils.js'; // Need to extract this function
import { CreeveyApi } from '../server/master/api.js';
import { startServer } from '../server/master/server.js';

export class CreeveyPlaywrightReporter implements Reporter {
  private testsManager: TestsManager;
  private config: FullConfig;
  private api: CreeveyApi | null = null;
  private reportDir: string;
  private screenDir: string;
  private port: number;

  constructor(options?: { reportDir?: string; screenDir?: string; port?: number }) {
    this.reportDir = options?.reportDir || path.join(process.cwd(), 'report');
    this.screenDir = options?.screenDir || path.join(process.cwd(), 'images');
    this.port = options?.port || 3000;

    // Initialize TestsManager
    this.testsManager = new TestsManager(this.screenDir, this.reportDir);
  }

  // Implement Reporter interface methods
  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;

    // Initialize report directory
    copyStatics(this.reportDir);

    // Start server API
    const resolveApi = startServer(this.reportDir, this.port, true);

    // Create and connect the API
    this.api = new CreeveyApi(this.testsManager);
    resolveApi(this.api);

    console.log(`Creevey report server started at http://localhost:${this.port}`);
  }

  onTestBegin(test: TestCase): void {
    // Map test to Creevey test format
    const creeveyTest = this.mapToCreeveyTest(test);

    // Update test status to running
    this.testsManager.updateTestStatus(creeveyTest.id, 'running');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Process test results and screenshots
    this.processTestResult(test, result);
  }

  onEnd(): void {
    // Save test data
    this.testsManager.saveTestData();
  }

  // Helper methods
  private mapToCreeveyTest(test: TestCase): any {
    // Implementation to map Playwright test to Creevey test format
  }

  private processTestResult(test: TestCase, result: TestResult): void {
    // Implementation to process test result
    // Handle attachments/screenshots
    // Convert to Creevey format
    // Update test status
  }
}
```

### 2. Extract and Expose copyStatics

Move the `copyStatics` function to a utility module so it can be reused by the Playwright reporter:

```typescript
// src/server/master/utils.ts
export async function copyStatics(reportDir: string): Promise<void> {
  // Implementation from start.ts
}
```

### 3. Modify server.ts to Export startServer Function

Modify the server.ts file to export a function that starts the server and returns a function to resolve the API:

```typescript
// src/server/master/server.ts
export function startServer(reportDir: string, port: number, uiEnabled: boolean): (api: CreeveyApi) => void {
  // Implementation
}
```

### 4. Screenshot Processing

Implement methods to handle Playwright screenshots and convert them to Creevey format:

```typescript
private async saveScreenshot(testId: string, attachmentPath: string, imageName: string): Promise<void> {
  // Copy screenshot to report directory
  // Structure folders correctly for Creevey format
}
```

### 5. Test Result Conversion

Implement logic to convert Playwright test results to Creevey test data format:

```typescript
private convertTestResult(test: TestCase, result: TestResult): TestResult {
  // Map Playwright test result to Creevey test result format
}
```

## Integration Tests

Create integration tests to verify the reporter functionality:

1. Test with basic Playwright tests
2. Verify screenshots are correctly stored
3. Verify test results are properly converted
4. Verify server API works correctly
5. Test UI integration

## Documentation

Create documentation that explains:

1. How to install and configure the reporter
2. How to use it with Playwright
3. How to customize its behavior
4. How to access the Creevey UI for test results

Example usage:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { CreeveyPlaywrightReporter } from 'creevey/playwright-reporter';

export default defineConfig({
  reporter: [
    ['list'], // Standard Playwright reporter
    [
      CreeveyPlaywrightReporter,
      {
        reportDir: './creevey-report',
        screenDir: './images',
        port: 3000,
      },
    ],
  ],
});
```

## Technical Considerations

1. The reporter should work independently of Creevey's main functionality
2. It should use the same core components as Creevey (TestsManager, API) but not depend on the Runner
3. It should maintain compatibility with both Creevey and Playwright versioning
4. It should handle different test structures and mapping them to Creevey's format

## Additional Considerations and Improvements

### 1. Error Handling and Resilience

The current design needs more robust error handling:

- Add try/catch blocks around key operations to prevent test runs from failing if the reporter encounters an issue
- Implement graceful degradation when components fail (e.g., if server can't start, still capture screenshots)
- Add diagnostic logging for troubleshooting issues

```typescript
// Example of improved error handling
onBegin(config: FullConfig, suite: Suite): void {
  this.config = config;

  try {
    // Initialize report directory
    copyStatics(this.reportDir).catch(error => {
      console.warn(`Warning: Failed to initialize report directory: ${error.message}`);
    });

    // Start server API
    try {
      const resolveApi = startServer(this.reportDir, this.port, true);
      this.api = new CreeveyApi(this.testsManager);
      resolveApi(this.api);
      console.log(`Creevey report server started at http://localhost:${this.port}`);
    } catch (serverError) {
      console.warn(`Warning: Could not start Creevey server: ${serverError.message}`);
      console.log('Screenshots will still be captured but UI will not be available');
    }
  } catch (error) {
    console.error(`Error in Creevey reporter initialization: ${error.message}`);
    // Continue with tests even if reporter initialization fails
  }
}
```

### 2. Resource Management

Add proper cleanup to prevent resource leaks:

```typescript
onEnd(): void {
  try {
    // Save test data
    this.testsManager.saveTestData();

    // Clean up server resources
    if (this.server) {
      console.log('Shutting down Creevey server...');
      this.server.close();
    }
  } catch (error) {
    console.error(`Error during reporter cleanup: ${error.message}`);
  }
}
```

### 3. Configuration Validation

Add configuration validation to prevent common issues:

```typescript
private validateConfig(): void {
  if (!this.reportDir) {
    console.warn('No reportDir provided, using default directory');
    this.reportDir = path.join(process.cwd(), 'report');
  }

  if (!this.screenDir) {
    console.warn('No screenDir provided, using default directory');
    this.screenDir = path.join(process.cwd(), 'images');
  }

  if (this.port < 1024 || this.port > 65535) {
    console.warn(`Invalid port ${this.port}, using default port 3000`);
    this.port = 3000;
  }
}
```

### 4. Better Screenshot Processing

Improve screenshot handling to support various attachment formats:

```typescript
private async processAttachments(test: TestCase, result: TestResult): Promise<void> {
  // Process all attachments
  for (const attachment of result.attachments) {
    // Skip non-image attachments
    if (!attachment.contentType?.startsWith('image/')) continue;

    try {
      // Determine image name from attachment name or generate one
      const imageName = attachment.name || `screenshot-${Date.now()}`;

      // Handle both buffer and path-based attachments
      if (attachment.body) {
        await this.saveScreenshotFromBuffer(test, attachment.name, attachment.body);
      } else if (attachment.path) {
        await this.saveScreenshotFromPath(test, attachment.name, attachment.path);
      }
    } catch (error) {
      console.error(`Failed to process attachment: ${error.message}`);
    }
  }
}
```

### 5. Playwright Test Step Integration

Support Playwright's test steps for more granular reporting:

```typescript
onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
  // Log step begins for detailed reporting
  if (this.debug) {
    console.log(`Step started: ${step.title}`);
  }
}

onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
  // Process any attachments added during this step
  if (step.attachments?.length) {
    for (const attachment of step.attachments) {
      if (attachment.contentType?.startsWith('image/')) {
        try {
          this.processAttachment(test, attachment);
        } catch (error) {
          console.warn(`Failed to process step attachment: ${error.message}`);
        }
      }
    }
  }
}
```

### 6. Performance Optimization

Add performance optimizations for handling large test suites:

- Batch processing of screenshots to avoid memory issues
- Lazy initialization of components to improve startup time
- Optional parallel processing of screenshots

```typescript
// Batch processing example
private async processBatchedScreenshots(): Promise<void> {
  if (this.screenshotQueue.length === 0) return;

  const batch = this.screenshotQueue.splice(0, 10); // Process 10 at a time
  await Promise.all(batch.map(item => this.processScreenshotItem(item)));

  if (this.screenshotQueue.length > 0) {
    // Continue with next batch
    setImmediate(() => this.processBatchedScreenshots());
  }
}
```

### 7. Better Test Identification

Improve the test identification logic to handle complex test hierarchies:

```typescript
private getTestIdentifier(test: TestCase): string {
  // Check for custom Creevey metadata first
  const creeveyAnnotation = test.annotations.find(a => a.type === 'creevey');
  if (creeveyAnnotation?.description) {
    try {
      const metadata = JSON.parse(creeveyAnnotation.description);
      if (metadata.testId) return metadata.testId;
    } catch (e) {
      // Invalid JSON, fallback to default
    }
  }

  // Generate consistent ID based on test location and title
  const projectName = test.parent.project().name;
  const testPath = [
    projectName,
    ...test.titlePath().slice(0, -1) // Parent titles
  ];

  return `${testPath.join('/')}/${test.title}`;
}
```

### 8. Compatibility with Existing Creevey Workflows

Ensure the reporter works well with existing Creevey workflows:

```typescript
constructor(options?: {
  reportDir?: string,
  screenDir?: string,
  port?: number,
  useExistingServer?: boolean,
  debug?: boolean
}) {
  // If useExistingServer is true, don't start a new server
  // This allows integration with existing Creevey server instances
  this.useExistingServer = options?.useExistingServer ?? false;
  // ...
}
```

### 9. Browser and Platform Metadata Capture

Improve metadata capture to include browser and environment information:

```typescript
private getBrowserInfo(test: TestCase): { name: string; version: string; } {
  const project = test.parent.project();
  const browser = project.use?.browserName;

  return {
    name: browser || 'unknown',
    version: 'latest' // Could be enhanced to get actual version
  };
}
```

## Future Enhancements

1. **AI-assisted comparison options**: Integrate with future Creevey AI comparison features

2. **Multi-browser support improvements**: Better handling of tests running across multiple browsers

3. **Custom comparison algorithms**: Allow specifying different comparison algorithms per test

4. **Playwright component testing integration**: Extend to support Playwright's component testing

5. **Test flakiness detection**: Add logic to identify and report flaky visual tests

6. **CI-specific optimizations**: Automatic configuration detection for common CI environments

7. **Visual testing coverage reports**: Generate reports showing visual testing coverage metrics

## Next Steps

1. Implement the core reporter class
2. Implement screenshot processing
3. Implement test result conversion
4. Extract and adapt necessary utilities
5. Add error handling and resilience features
6. Create integration tests
7. Document the reporter
