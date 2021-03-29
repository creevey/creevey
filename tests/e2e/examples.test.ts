import { readdirSync } from 'fs';
import { describe } from 'mocha';
import {
  assertExtractedStories,
  assertExtractedTests,
  assertWebpackBundle,
  execSync,
  prepareWorkDir,
  storybookDir,
  updateApprovals,
} from './test-helpers';

// TODO What to do with `.ts` configs?

const excludedExamples = [
  'official-storybook', // NOTE: Handled by storybook.test.ts
  'standalone-preview', // NOTE: This isn't regular stories project
];

let examples: string[] = [];
try {
  examples = readdirSync(`${storybookDir}/examples`);
} catch (_) {
  /* noop */
}

// TODO Just skip for now. Unskip examples one by one and approve the result
describe.skip('Storybook Examples E2E', function () {
  this.timeout('300s');

  examples
    .filter((suiteName) => !excludedExamples.includes(suiteName))
    .forEach((suiteName) => {
      describe(suiteName, function () {
        const workDir = `${storybookDir}/examples/${suiteName}`;

        before(function () {
          prepareWorkDir(workDir);
          execSync('npm run build-storybook', { cwd: workDir });
        });

        after(function () {
          updateApprovals(workDir, suiteName);
        });

        assertExtractedTests(workDir, suiteName);

        assertWebpackBundle(workDir, suiteName);

        assertExtractedStories(workDir);
      });
    });
});
