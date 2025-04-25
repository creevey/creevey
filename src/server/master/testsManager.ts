import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import EventEmitter from 'events';
import {
  ServerTest,
  TestMeta,
  TestResult,
  TestStatus,
  CreeveyUpdate,
  ApprovePayload,
  isDefined,
  isFunction,
  CreeveyStatus,
} from '../../types.js';
import { tryToLoadTestsData } from '../utils.js';
import { copyFile, mkdir, writeFile } from 'fs/promises';

/**
 * TestsManager is responsible for all operations related to test data management
 * including loading, saving, merging, and updating test data.
 * It extends EventEmitter to emit update events that can be subscribed to.
 */
export class TestsManager extends EventEmitter {
  private tests: Partial<Record<string, ServerTest>> = {};
  private screenDir: string;
  private reportDir: string;

  /**
   * Creates a new TestsManager instance
   * @param screenDir Directory for storing reference images
   * @param reportDir Directory for storing reports and screenshots
   */
  constructor(screenDir: string, reportDir: string) {
    super();
    this.screenDir = screenDir;
    this.reportDir = reportDir;
  }

  /**
   * Get a copy of all tests
   * @returns all tests
   */
  public getTests(): Partial<Record<string, ServerTest>> {
    return this.tests;
  }

  /**
   * Get a test by ID
   * @param id Test ID
   * @returns Test data
   */
  public getTest(id: string): ServerTest | undefined {
    return this.tests[id];
  }

  /**
   * Get test data in a format suitable for status reporting
   * @returns Test data in the format needed for status
   */
  public getTestsData(): CreeveyStatus['tests'] {
    const testsData: CreeveyStatus['tests'] = {};

    Object.entries(this.tests).forEach(([id, test]) => {
      if (!test) return;

      const { story: _, fn: __, ...testData } = test;
      testsData[id] = testData;
    });

    return testsData;
  }

  /**
   * Load tests from a report file
   */
  public loadTestsFromReport(): Partial<Record<string, ServerTest>> {
    const reportDataPath = path.join(this.reportDir, 'data.js');
    const testsFromReport = tryToLoadTestsData(reportDataPath) ?? {};
    return testsFromReport;
  }

  /**
   * Merge tests from report with tests from stories
   */
  private mergeTests(
    testsWithReports: CreeveyStatus['tests'],
    testsFromStories: Partial<Record<string, ServerTest>>,
  ): Partial<Record<string, ServerTest>> {
    Object.values(testsFromStories)
      .filter(isDefined)
      .forEach((test) => {
        const testWithReport = testsWithReports[test.id];
        if (!testWithReport) return;
        test.retries = testWithReport.retries;
        if (testWithReport.status === 'success' || testWithReport.status === 'failed') {
          test.status = testWithReport.status;
        }
        test.results = testWithReport.results;
        test.approved = testWithReport.approved;
      });

    return testsFromStories;
  }

  public loadAndMergeTests(testsFromStories: Partial<Record<string, ServerTest>>): Partial<Record<string, ServerTest>> {
    const testsFromReport = this.loadTestsFromReport();

    return this.mergeTests(testsFromReport, testsFromStories);
  }

  /**
   * Update tests with incremental changes
   * @param testsDiff Tests to update or remove
   */
  public updateTests(testsDiff: Partial<Record<string, ServerTest>>): CreeveyUpdate | null {
    const tests: CreeveyUpdate['tests'] = {};
    const removedTests: TestMeta[] = [];

    Object.entries(testsDiff).forEach(([id, newTest]) => {
      if (newTest) {
        if (this.tests[id]) {
          this.tests[id] = {
            ...newTest,
            retries: this.tests[id].retries,
            results: this.tests[id].results,
            approved: this.tests[id].approved,
          };
        } else {
          this.tests[id] = newTest;
        }

        const { story: _, fn: __, ...restTest } = newTest;
        tests[id] = { ...restTest, status: 'unknown' };
      } else if (this.tests[id]) {
        const { id: testId, browser, testName, storyPath, storyId } = this.tests[id];
        removedTests.push({ id: testId, browser, testName, storyPath, storyId });
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.tests[id];
      }
    });

    this.saveTestsToJson();

    const update = { tests, removedTests };
    this.emit('update', update);
    return update;
  }

  /**
   * Update test result
   * @param id Test ID
   * @param status New test status
   * @param result Optional test result
   */
  public updateTestStatus(id: string, status: TestStatus, result?: TestResult): CreeveyUpdate | null {
    // TODO Handle 'retrying' status
    const test = this.tests[id];
    if (!test) return null;

    const { browser, testName, storyPath, storyId } = test;
    test.status = status === 'retrying' ? 'failed' : status;

    if (!result) {
      // NOTE: Running status
      const update = { tests: { [id]: { id, browser, testName, storyPath, status, storyId } } };
      this.emit('update', update);
      return update;
    }

    test.results ??= [];
    test.results.push(result);

    if (status === 'failed') {
      test.approved = null;
    }

    const update = {
      tests: {
        [id]: {
          id,
          browser,
          testName,
          storyPath,
          status,
          approved: test.approved,
          results: [result],
          storyId,
        },
      },
    };

    this.emit('update', update);
    return update;
  }

  /**
   * Save tests to JSON file
   * @param reportDir Directory to save the JSON file
   */
  public saveTestsToJson(): void {
    mkdirSync(this.reportDir, { recursive: true });
    writeFileSync(
      path.join(this.reportDir, 'tests.json'),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      JSON.stringify(this.tests, (_, value) => (isFunction(value) ? value.toString() : value), 2),
    );
  }

  /**
   * Save test data to a module
   * @param data Test data to include in the module
   */
  public async saveTestData(data: CreeveyStatus['tests'] = this.getTestsData()): Promise<void> {
    const dataModule = `
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.__CREEVEY_DATA__ = factory();
  }
}(this, function () { return ${JSON.stringify(data)} }));
`;
    await writeFile(path.join(this.reportDir, 'data.js'), dataModule);
  }

  /**
   * Copy image for approval
   * @param test Test data
   * @param image Image name
   * @param actual Actual image path
   */
  private async copyImage(test: ServerTest, image: string, actual: string): Promise<void> {
    const { browser, testName, storyPath } = test;
    const restPath = [...storyPath, testName].filter(isDefined);
    const testPath = path.join(...restPath, image == browser ? '' : browser);
    const srcImagePath = path.join(this.reportDir, testPath, actual);
    const dstImagePath = path.join(this.screenDir, testPath, `${image}.png`);
    await mkdir(path.join(this.screenDir, testPath), { recursive: true });
    await copyFile(srcImagePath, dstImagePath);
  }

  /**
   * Approve a specific test
   * @param payload Approval payload with test ID, retry index, and image name
   */
  public async approve({ id, retry, image }: ApprovePayload): Promise<CreeveyUpdate | null> {
    const test = this.tests[id];
    if (!test?.results) return null;
    const result = test.results[retry];
    if (!result.images) return null;
    const images = result.images[image];
    if (!images) return null;
    test.approved ??= {};
    const { browser, testName, storyPath, storyId } = test;

    await this.copyImage(test, image, images.actual);

    test.approved[image] = retry;

    if (Object.keys(result.images).every((name) => typeof test.approved?.[name] == 'number')) {
      test.status = 'approved';
    }

    const update = {
      tests: {
        [id]: {
          id,
          browser,
          testName,
          storyPath,
          status: test.status,
          approved: test.approved,
          results: test.results.slice(-1),
          storyId,
        },
      },
    };

    this.emit('update', update);
    return update;
  }

  /**
   * Approve all failed tests
   */
  public async approveAll(): Promise<CreeveyUpdate> {
    const updatedTests: NonNullable<CreeveyUpdate['tests']> = {};
    for (const test of Object.values(this.tests)) {
      if (!test?.results) continue;
      const retry = test.results.length - 1;
      const { images, status } = test.results.at(retry) ?? {};
      if (!images || status != 'failed') continue;
      for (const [name, image] of Object.entries(images)) {
        if (!image) continue;
        await this.copyImage(test, name, image.actual);

        test.approved ??= {};
        test.approved[name] = retry;
        test.status = 'approved';

        updatedTests[test.id] = {
          id: test.id,
          browser: test.browser,
          storyPath: test.storyPath,
          storyId: test.storyId,
          status: test.status,
          approved: { [name]: retry },
        };
      }
    }

    const result = { tests: updatedTests };
    this.emit('update', result);
    return result;
  }
}
