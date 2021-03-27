// import { expect } from 'chai';
import path from 'path';
import { after, before, describe } from 'mocha';
import {
  assertExtractedStories,
  assertExtractedTests,
  assertWebpackBundle,
  execSync,
  prepareWorkDir,
  updateApprovals,
} from './test-helpers';

// TODO Support storiesOf variables

const storybookDir = path.join(process.cwd(), '../storybook');
const workDir = `${storybookDir}/examples/official-storybook`;

describe('Storybook Official E2E', function () {
  this.timeout('300s');

  before(function () {
    prepareWorkDir(workDir);
    execSync('npm run build-storybook', { cwd: workDir });
  });

  after(function () {
    updateApprovals(workDir, 'storybook');
  });

  assertExtractedTests(workDir, 'storybook');

  assertWebpackBundle(workDir, 'storybook');

  assertExtractedStories(workDir);
});
