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
    (listener) => config.storiesProvider(config, listener),
    (testsDiff) => {
      runner.updateTests(testsDiff);
    },
  );

  testsManager.updateTests(testsManager.loadAndMergeTests(tests));

  return runner;
}
