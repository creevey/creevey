import { Config } from '../types.js';
import { logger } from './logger.js';
import { TestsManager } from './master/testsManager.js';
import { start as startServer } from './master/server.js';
import { CreeveyApi } from './master/api.js';

/**
 * UI Update Mode implementation.
 * This mode allows users to review and approve screenshots from the browser interface.
 * It combines the functionality of both --ui and --update flags.
 *
 * @param config Creevey configuration
 * @param port Port to run the server on
 */
export async function uiUpdate(config: Config, port: number): Promise<void> {
  logger().info('Starting UI Update Mode');

  // Initialize TestsManager with the configured directories
  const testsManager = new TestsManager(config.screenDir, config.reportDir);

  // Load tests from the report
  const testsFromReport = testsManager.loadTestsFromReport();

  if (Object.keys(testsFromReport).length === 0) {
    logger().warn('No tests found in report. Run tests first to generate report data.');
    return;
  }

  // Set tests in the manager
  testsManager.updateTests(testsFromReport);

  // Start API server with UI enabled
  const resolveApi = startServer(config.reportDir, port, true);

  // Initialize API
  const api = new CreeveyApi(testsManager);

  // Resolve the API for the server
  resolveApi(api);

  // Save test data to make it available for the UI
  await testsManager.saveTestData();

  logger().info(`UI Update Mode started on http://localhost:${port}/`);
  logger().info('You can now review and approve screenshots from the browser.');
}
