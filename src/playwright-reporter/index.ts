import type { Reporter, FullConfig, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import path from 'path';
import fs from 'fs/promises';
import { TestsManager } from '../server/master/testsManager.js';
import { CreeveyApi } from '../server/master/api.js';
import { ServerTest, TestMeta, TestStatus, TestResult as CreeveyTestResult } from '../types.js';
import { copyStatics } from '../server/utils.js';

/**
 * Simple async queue to handle operations in sequence without returning promises
 * from reporter methods that should be synchronous
 */
class AsyncQueue {
  private queue: Promise<void>;

  constructor() {
    this.queue = Promise.resolve();
  }

  /**
   * Add an async operation to the queue
   * @param operation Async operation to execute
   */
  enqueue(operation: () => Promise<void>): void {
    this.queue = this.queue.then(operation).catch((error: unknown) => {
      console.error(`Error in async queue: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  /**
   * Wait for all operations in the queue to complete
   */
  async waitForCompletion(): Promise<void> {
    await this.queue;
  }
}

/**
 * CreeveyPlaywrightReporter is a Playwright reporter that integrates with Creevey
 * to provide visual testing capabilities and use Creevey's UI for reviewing and approving screenshots.
 */
export class CreeveyPlaywrightReporter implements Reporter {
  private testsManager: TestsManager;
  private api: CreeveyApi | null = null;
  private reportDir: string;
  private screenDir: string;
  private port: number;
  private debug: boolean;
  private startServer: ((reportDir: string, port: number, uiEnabled: boolean) => (api: CreeveyApi) => void) | null =
    null;
  private testIdMap = new Map<string, string>(); // Maps Playwright test IDs to Creevey test IDs
  private asyncQueue = new AsyncQueue();

  /**
   * Creates a new instance of the CreeveyPlaywrightReporter
   * @param options Configuration options for the reporter
   */
  constructor(options?: { reportDir?: string; screenDir?: string; port?: number; debug?: boolean }) {
    this.reportDir = options?.reportDir ?? path.join(process.cwd(), 'report');
    this.screenDir = options?.screenDir ?? path.join(process.cwd(), 'images');
    this.port = options?.port ?? 3000;
    this.debug = options?.debug ?? false;

    // Initialize TestsManager
    this.testsManager = new TestsManager(this.screenDir, this.reportDir);
  }

  /**
   * Called when the test run starts
   * @param config Playwright configuration
   * @param suite Test suite information
   */
  onBegin(_config: FullConfig, _suite: Suite): void {
    this.logDebug('CreeveyPlaywrightReporter started');

    // Use the async queue to handle initialization without returning a promise
    this.asyncQueue.enqueue(async () => {
      try {
        // Dynamically import the modules to avoid circular dependencies
        const { start } = await import('../server/master/server.js');
        this.startServer = start;

        // Initialize report directory
        try {
          await fs.mkdir(this.reportDir, { recursive: true });
          await copyStatics(this.reportDir);
        } catch (error) {
          this.logError(
            `Failed to initialize report directory: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        // Start server API
        try {
          const resolveApi = this.startServer(this.reportDir, this.port, true);

          // Create and connect the API
          this.api = new CreeveyApi(this.testsManager);
          resolveApi(this.api);

          console.log(`Creevey report server started at http://localhost:${this.port}`);
        } catch (error) {
          this.logError(`Could not start Creevey server: ${error instanceof Error ? error.message : String(error)}`);
          console.log('Screenshots will still be captured but UI will not be available');
        }
      } catch (error) {
        this.logError(
          `Error in Creevey reporter initialization: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  /**
   * Called when a test begins
   * @param test Test case information
   * @param result Test result (initially empty)
   */
  onTestBegin(test: TestCase, _result: TestResult): void {
    try {
      // Map test to Creevey test format
      const creeveyTest = this.mapToCreeveyTest(test);
      if (!creeveyTest) return;

      // Create a mapping from Playwright test ID to Creevey test ID
      this.testIdMap.set(test.id, creeveyTest.id);

      // Update test status to running
      this.testsManager.updateTestStatus(creeveyTest.id, 'running');

      this.logDebug(`Test started: ${test.title} (${creeveyTest.id})`);
    } catch (error) {
      this.logError(`Error in onTestBegin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Called when a test step begins
   * @param test Test case information
   * @param result Test result
   * @param step Test step information
   */
  onStepBegin(test: TestCase, _result: TestResult, step: TestStep): void {
    if (this.debug) {
      this.logDebug(`Step started: ${step.title} in test: ${test.title}`);
    }
  }

  /**
   * Called when a test step ends
   * @param test Test case information
   * @param result Test result
   * @param step Test step information
   */
  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep): void {
    try {
      // If step has attachments, process them
      if (step.attachments.length > 0) {
        this.logDebug(`Processing ${step.attachments.length} attachments from step: ${step.title}`);

        // We'll process attachments in onTestEnd for simplicity in this initial implementation
      }
    } catch (error) {
      this.logError(`Error in onStepEnd: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Called when a test ends
   * @param test Test case information
   * @param result Test result
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    const creeveyTestId = this.testIdMap.get(test.id);

    // Use the async queue to handle result processing without returning a promise
    this.asyncQueue.enqueue(async () => {
      try {
        // Process test results and screenshots
        await this.processTestResult(test, result);

        if (creeveyTestId) {
          this.logDebug(`Test ended: ${test.title} (${creeveyTestId}) with status: ${result.status}`);
        }
      } catch (error) {
        this.logError(`Error in onTestEnd: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Called when the test run ends
   * @param result The overall test run result
   */
  onEnd(result: { status: 'passed' | 'failed' | 'timedout' | 'interrupted' }): void {
    // Use the async queue to handle final operations without returning a promise
    this.asyncQueue.enqueue(async () => {
      try {
        // Wait for all previous operations to complete
        await this.asyncQueue.waitForCompletion();

        // Save test data
        await this.testsManager.saveTestData();

        this.logDebug(`Test run ended with status: ${result.status}`);
        console.log(`Visual test results available at http://localhost:${this.port}`);

        // No cleanup of server here as it needs to stay running for the user to view results
      } catch (error) {
        this.logError(`Error during reporter cleanup: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Maps a Playwright test to a Creevey test format
   * @param test Playwright test case
   * @returns Creevey test object or null if mapping fails
   */
  private mapToCreeveyTest(test: TestCase): ServerTest | null {
    try {
      // Try to extract Creevey metadata from annotations
      let testName = test.title;
      let browser = 'chromium'; // Default browser
      let storyPath: string[] = [];

      const creeveyAnnotation = test.annotations.find((a) => a.type === 'creevey');
      if (creeveyAnnotation?.description) {
        try {
          const metadata = JSON.parse(creeveyAnnotation.description) as {
            testName?: string;
            browser?: string;
            storyPath?: string[];
          };
          if (metadata.testName) testName = metadata.testName;
          if (metadata.browser) browser = metadata.browser;
          if (metadata.storyPath) storyPath = metadata.storyPath;
        } catch (e) {
          this.logError(`Failed to parse Creevey metadata: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // If no explicit storyPath, use the project and file path
      if (storyPath.length === 0) {
        const projectName = test.parent.project()?.name;
        const titlePath = test.titlePath().slice(0, -1); // Exclude the test title itself
        storyPath = projectName ? [projectName, ...titlePath] : titlePath;
      }

      // Generate a unique test ID
      const testId = `${storyPath.join('/')}/${testName}/${browser}`;

      // Create the test metadata
      const testMeta: TestMeta = {
        id: testId,
        storyPath,
        browser,
        testName,
        storyId: storyPath.join('/'),
      };

      // Create a stub ServerTest object
      // This is missing the story and fn properties which would be used in a real Creevey test
      // However, for our reporter purposes, we just need the metadata
      const serverTest: ServerTest = {
        ...testMeta,
        story: {
          parameters: {},
          initialArgs: {},
          argTypes: {},
          component: '',
          componentId: '',
          name: '',
          tags: [],
          title: '',
          kind: '',
          id: '',
          story: '',
        }, // Placeholder
        fn: async () => {
          /* Empty function as placeholder */
        }, // Placeholder
      };

      return serverTest;
    } catch (error) {
      this.logError(`Error mapping test to Creevey format: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Process a test result and any attachments
   * @param test Playwright test case
   * @param result Playwright test result
   */
  private async processTestResult(test: TestCase, result: TestResult): Promise<void> {
    const creeveyTestId = this.testIdMap.get(test.id);
    if (!creeveyTestId) {
      this.logError(`No Creevey test ID found for test: ${test.title}`);
      return;
    }

    // Determine test status
    let status: TestStatus;
    switch (result.status) {
      case 'passed':
        status = 'success';
        break;
      case 'failed':
      case 'timedOut':
        status = 'failed';
        break;
      default:
        status = 'unknown';
    }

    // Process attachments
    const images: Record<string, { actual: string }> = {};
    const attachmentPaths: string[] = [];

    if (result.attachments.length > 0) {
      await fs.mkdir(path.join(this.reportDir, creeveyTestId), { recursive: true });

      for (const attachment of result.attachments) {
        // Only process image attachments
        if (!attachment.contentType.startsWith('image/')) continue;

        try {
          const imageName = attachment.name || `screenshot-${Date.now()}`;
          const imagePath = path.join(creeveyTestId, `${imageName}.png`);
          const fullImagePath = path.join(this.reportDir, imagePath);

          // Ensure directory exists
          await fs.mkdir(path.dirname(fullImagePath), { recursive: true });

          // Handle either buffer or path-based attachments
          if (attachment.body) {
            await fs.writeFile(fullImagePath, attachment.body);
          } else if (attachment.path) {
            await fs.copyFile(attachment.path, fullImagePath);
          }

          // Add to images for the test result
          images[imageName] = { actual: `${imageName}.png` };
          attachmentPaths.push(imagePath);

          this.logDebug(`Saved screenshot: ${imageName} for test: ${test.title}`);
        } catch (error) {
          this.logError(`Failed to process attachment: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Update test status and result
    const testResult: CreeveyTestResult = {
      status: status === 'success' ? 'success' : 'failed',
      retries: result.retry,
      images,
      error: result.error?.message ?? undefined,
      duration: result.duration,
      attachments: attachmentPaths,
      browserName: test.parent.project()?.name ?? 'unknown',
    };

    this.testsManager.updateTestStatus(creeveyTestId, status, testResult);
  }

  /**
   * Logs a debug message if debug mode is enabled
   * @param message Message to log
   */
  private logDebug(message: string): void {
    if (this.debug) {
      console.log(`[Creevey Reporter] ${message}`);
    }
  }

  /**
   * Logs an error message
   * @param message Error message to log
   */
  private logError(message: string): void {
    console.error(`[Creevey Reporter] ERROR: ${message}`);
  }
}
