import EventEmitter from 'events';
import { ServerTest, TestResult, TestStatus, CreeveyUpdate, ApprovePayload, CreeveyStatus } from '../../types.js';
/**
 * TestsManager is responsible for all operations related to test data management
 * including loading, saving, merging, and updating test data.
 * It extends EventEmitter to emit update events that can be subscribed to.
 */
export declare class TestsManager extends EventEmitter {
    private tests;
    private screenDir;
    private reportDir;
    /**
     * Creates a new TestsManager instance
     * @param screenDir Directory for storing reference images
     * @param reportDir Directory for storing reports and screenshots
     */
    constructor(screenDir: string, reportDir: string);
    /**
     * Get a copy of all tests
     * @returns all tests
     */
    getTests(): Partial<Record<string, ServerTest>>;
    /**
     * Get a test by ID
     * @param id Test ID
     * @returns Test data
     */
    getTest(id: string): ServerTest | undefined;
    /**
     * Get test data in a format suitable for status reporting
     * @returns Test data in the format needed for status
     */
    getTestsData(): CreeveyStatus['tests'];
    /**
     * Load tests from a report file
     */
    loadTestsFromReport(): Partial<Record<string, ServerTest>>;
    /**
     * Merge tests from report with tests from stories
     */
    mergeTests(testsWithReports: CreeveyStatus['tests'], testsFromStories: Partial<Record<string, ServerTest>>): Partial<Record<string, ServerTest>>;
    /**
     * Update tests with incremental changes
     * @param testsDiff Tests to update or remove
     */
    updateTests(testsDiff: Partial<Record<string, ServerTest>>): CreeveyUpdate | null;
    /**
     * Update test result
     * @param id Test ID
     * @param status New test status
     * @param result Optional test result
     */
    updateTestStatus(id: string, status: TestStatus, result?: TestResult): CreeveyUpdate | null;
    /**
     * Save tests to JSON file
     * @param reportDir Directory to save the JSON file
     */
    saveTestsToJson(): void;
    /**
     * Save test data to a module
     * @param data Test data to include in the module
     */
    saveTestData(data?: CreeveyStatus['tests']): Promise<void>;
    /**
     * Copy image for approval
     * @param test Test data
     * @param image Image name
     * @param actual Actual image path
     */
    private copyImage;
    /**
     * Approve a specific test
     * @param payload Approval payload with test ID, retry index, and image name
     */
    approve({ id, retry, image }: ApprovePayload): Promise<CreeveyUpdate | null>;
    /**
     * Approve all failed tests
     */
    approveAll(): Promise<CreeveyUpdate>;
}
