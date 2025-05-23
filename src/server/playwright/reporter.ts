import path from 'path';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import type { Reporter, FullConfig, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import {
  type ServerTest,
  type TestMeta,
  type TestStatus,
  type TestResult as CreeveyTestResult,
  isDefined,
  Images,
} from '../../types.js';
import { TestsManager } from '../master/testsManager.js';
import { CreeveyApi } from '../master/api.js';
import { copyStatics } from '../utils.js';
import { start } from '../master/server.js';

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
  onBegin(_config: FullConfig, suite: Suite): void {
    this.logDebug('CreeveyPlaywrightReporter started');

    // Use the async queue to handle initialization without returning a promise
    this.asyncQueue.enqueue(async () => {
      try {
        await fs.mkdir(this.reportDir, { recursive: true });
        await copyStatics(this.reportDir);
      } catch (error) {
        this.logError(
          `Failed to initialize report directory: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // TODO: Handle SIGINT

      // Start server API
      try {
        const resolveApi = start(this.reportDir, this.port, true);

        // Create and connect the API
        this.api = new CreeveyApi(this.testsManager);
        resolveApi(this.api);

        const testsList = suite
          .allTests()
          .map((test) => {
            const creeveyTest = this.mapToCreeveyTest(test);
            if (!creeveyTest) return;

            this.testIdMap.set(test.id, creeveyTest.id);

            return creeveyTest;
          })
          .filter(isDefined);

        const tests: Record<string, ServerTest> = {};
        for (const test of testsList) {
          tests[test.id] = test;
        }

        this.testsManager.updateTests(tests);

        console.log(`Creevey report server started at http://localhost:${this.port}`);
      } catch (error) {
        this.logError(`Could not start Creevey server: ${error instanceof Error ? error.message : String(error)}`);
        console.log('Screenshots will still be captured but UI will not be available');
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
      const creeveyTestId = this.testIdMap.get(test.id);

      if (creeveyTestId) {
        // Update test status to running
        this.testsManager.updateTestStatus(creeveyTestId, 'running');

        this.logDebug(`Test started: ${test.title} (${creeveyTestId})`);
      }
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
    /*
    [Creevey Reporter] Step started: browserType.launch in test: 100 X 100 Vs 2000 X 100
    [Creevey Reporter] Step started: browserType.launch in test: Side By Side
    [Creevey Reporter] Step started: browserType.launch in test: Full
    */
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
      const storyName = test.title;
      const storyTitle = test.parent.title;
      const projectName = test.parent.project()?.name ?? 'chromium';
      const testPath = [storyTitle, storyName, projectName];
      const { description: storyId } = test.annotations.find((annotation) => annotation.type === 'storyId') ?? {};

      // Generate a unique test ID
      const testId = createHash('sha1').update(testPath.join('/')).digest('hex');

      // Create the test metadata
      const testMeta: TestMeta = {
        id: testId,
        storyPath: [...storyTitle.split('/').map((x) => x.trim()), storyName],
        browser: projectName,
        storyId: storyId ?? '',
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
          name: storyName,
          tags: [],
          title: storyTitle,
          kind: storyTitle,
          id: storyId ?? '',
          story: storyName,
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
      return Promise.resolve();
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
    const images: Record<string, Images> = {};
    const attachmentPaths: string[] = [];
    const projectName = test.parent.project()?.name ?? 'chromium';

    for (const attachment of result.attachments) {
      const { name, path: attachmentPath } = attachment;

      if (!attachmentPath) continue;

      attachmentPaths.push(attachmentPath);

      switch (true) {
        case name.includes('actual'): {
          images[projectName] = { ...images[projectName], actual: name };
          break;
        }
        case name.includes('expect'): {
          images[projectName] = { ...images[projectName], expect: name };
          break;
        }
        case name.includes('diff'): {
          images[projectName] = { ...images[projectName], diff: name };
          break;
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
      browserName: projectName,
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
