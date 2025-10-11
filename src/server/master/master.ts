import { Config } from '../../types.js';
import { loadTestsFromStories } from '../stories.js';
import { TestsManager } from './testsManager.js';
import Runner from './runner.js';

export default async function master(config: Config, gridUrl?: string): Promise<Runner> {
  // Create TestsManager instance
  const testsManager = new TestsManager(config.screenDir, config.reportDir);

  // Create Runner with TestsManager
  const runner = new Runner(config, testsManager, gridUrl);

  await runner.init();

  // Load tests from stories and update TestsManager
  const tests = await loadTestsFromStories(
    Object.keys(config.browsers),
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    (listener) => config.storiesProvider(config, listener),
    (testsDiff) => {
      runner.updateTests(testsDiff);
    },
  );

  const testsFromReport = testsManager.loadTestsFromReport();

  testsManager.updateTests(testsManager.mergeTests(testsFromReport, tests));

  return runner;
}
