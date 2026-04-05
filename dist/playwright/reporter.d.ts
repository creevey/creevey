import type { Reporter, FullConfig, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
/**
 * CreeveyPlaywrightReporter is a Playwright reporter that integrates with Creevey
 * to provide visual testing capabilities and use Creevey's UI for reviewing and approving screenshots.
 */
declare class CreeveyPlaywrightReporter implements Reporter {
    private testsManager;
    private host;
    private port;
    private debug;
    private testIdMap;
    private asyncQueue;
    private abortPoll;
    private creeveyApiEndpoint;
    /**
     * Creates a new instance of the CreeveyPlaywrightReporter
     * @param options Configuration options for the reporter
     */
    constructor(options?: {
        host?: string;
        port?: number;
        debug?: boolean;
    });
    /**
     * Called when the test run starts
     * @param config Playwright configuration
     * @param suite Test suite information
     */
    onBegin(config: FullConfig, suite: Suite): void;
    /**
     * Called when a test begins
     * @param test Test case information
     * @param result Test result (initially empty)
     */
    onTestBegin(test: TestCase, _result: TestResult): void;
    /**
     * Called when a test step begins
     * @param test Test case information
     * @param result Test result
     * @param step Test step information
     */
    onStepBegin(test: TestCase, _result: TestResult, step: TestStep): void;
    /**
     * Called when a test step ends
     * @param test Test case information
     * @param result Test result
     * @param step Test step information
     */
    onStepEnd(_test: TestCase, _result: TestResult, step: TestStep): void;
    /**
     * Called when a test ends
     * @param test Test case information
     * @param result Test result
     */
    onTestEnd(test: TestCase, result: TestResult): void;
    /**
     * Called when the test run ends
     * @param result The overall test run result
     */
    onEnd(result: {
        status: 'passed' | 'failed' | 'timedout' | 'interrupted';
    }): Promise<void>;
    private pollCreeveyApi;
    private commitTestResults;
    /**
     * Maps a Playwright test to a Creevey test format
     * @param test Playwright test case
     * @returns Creevey test object or null if mapping fails
     */
    private mapToCreeveyTest;
    /**
     * Process a test result and any attachments
     * @param test Playwright test case
     * @param result Playwright test result
     */
    private processTestResult;
    /**
     * Logs a debug message if debug mode is enabled
     * @param message Message to log
     */
    private logDebug;
    /**
     * Logs an error message
     * @param message Error message to log
     */
    private logError;
}
export default CreeveyPlaywrightReporter;
