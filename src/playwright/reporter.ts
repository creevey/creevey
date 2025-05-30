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
} from '../types.js';
import { TestsManager } from '../server/master/testsManager.js';
import { CreeveyApi } from '../server/master/api.js';
import { copyStatics } from '../server/utils.js';
import { start } from '../server/master/server.js';
import assert from 'assert';

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
class CreeveyPlaywrightReporter implements Reporter {
  private testsManager: TestsManager | null = null;
  private api: CreeveyApi | null = null;
  private port: number;
  private debug = !!process.env.PWDEBUG;
  private testIdMap = new Map<string, string>(); // Maps Playwright test IDs to Creevey test IDs
  private asyncQueue = new AsyncQueue();

  /**
   * Creates a new instance of the CreeveyPlaywrightReporter
   * @param options Configuration options for the reporter
   */
  constructor(options?: { port?: number }) {
    this.port = options?.port ?? 3000;
  }

  /**
   * Called when the test run starts
   * @param config Playwright configuration
   * @param suite Test suite information
   */
  onBegin(config: FullConfig, suite: Suite): void {
    this.logDebug('CreeveyPlaywrightReporter started');

    const [snapshotDir, ...restSnapshotDirs] = [...new Set(config.projects.map((project) => project.snapshotDir))];
    const [outputDir, ...restOutputDirs] = [...new Set(config.projects.map((project) => project.outputDir))];

    assert(restSnapshotDirs.length === 0, 'Currently multiple snapshot directories are not supported');
    assert(restOutputDirs.length === 0, 'Currently multiple output directories are not supported');

    // Initialize TestsManager
    this.testsManager = new TestsManager(snapshotDir, outputDir);

    // Use the async queue to handle initialization without returning a promise
    this.asyncQueue.enqueue(async () => {
      assert(this.testsManager, 'TestsManager is not initialized');

      try {
        await fs.mkdir(outputDir, { recursive: true });
        await copyStatics(outputDir);
      } catch (error) {
        this.logError(
          `Failed to initialize report directory: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Start server API
      try {
        const resolveApi = start(outputDir, this.port, true);

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
      assert(this.testsManager, 'TestsManager is not initialized');

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
  async onEnd(result: { status: 'passed' | 'failed' | 'timedout' | 'interrupted' }): Promise<void> {
    // Use the async queue to handle final operations without returning a promise
    this.asyncQueue.enqueue(async () => {
      try {
        assert(this.testsManager, 'TestsManager is not initialized');

        // Save test data
        await this.testsManager.saveTestData();

        this.logDebug(`Test run ended with status: ${result.status}`);
        // TODO: Tell how to run reporter `yarn creevey update ./report --ui`
      } catch (error) {
        this.logError(`Error during reporter cleanup: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    // Wait for all previous operations to complete
    await this.asyncQueue.waitForCompletion();
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

    assert(this.testsManager, 'TestsManager is not initialized');

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

export default CreeveyPlaywrightReporter;
