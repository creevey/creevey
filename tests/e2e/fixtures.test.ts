import { readdirSync } from 'fs';
import { after, before, describe, it } from 'mocha';
import shell from 'shelljs';
import { dirSync } from 'tmp';
import {
  assertExtractedStories,
  assertExtractedTests,
  assertWebpackBundle,
  execSync,
  prepareWorkDir,
  updateApprovals,
} from './test-helpers';

// TODO tests
// StoriesOf - Parameters, global, kind, story
// CSF - Parameters, global, kind, story
// 6.0 - export global parameters
// SubKinds
// mdx
// from frameworks (angular, react, vue, nextjs, etc)
// Apply loader only for stories files

// 6.1 https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#single-story-hoisting

const skipWebpackAssertion = ['sb-6.3-webpack5'];
const skipStorybookBuild = ['sb-5.0', 'sb-5.0-require', 'sb-5.1', 'sb-5.2', 'sb-5.3-config'];
const skipExtractedStoriesAssertion = [...skipStorybookBuild, 'sb-5.3'];

describe('Storybook Fixtures E2E', function () {
  this.timeout('300s');

  readdirSync(`${__dirname}/storybook.fixtures`).forEach((suiteName) => {
    describe(suiteName, function () {
      const shouldAssertWebpack = !skipWebpackAssertion.includes(suiteName);
      const shouldBuildStorybook = !skipStorybookBuild.includes(suiteName);
      const shouldAssertExtractedStories = !skipExtractedStoriesAssertion.includes(suiteName);
      const workDir = dirSync({ prefix: `creevey-${suiteName}` }).name;

      before(function () {
        shell.cp('-r', `${__dirname}/storybook.fixtures/${suiteName}/{.,}*`, workDir);
        execSync('npm install', { cwd: workDir });
        execSync('npm ls @storybook/react', { cwd: workDir });
        prepareWorkDir(workDir, shouldAssertWebpack);
      });

      after(async function () {
        await updateApprovals(workDir, suiteName, shouldAssertWebpack);
        shell.rm('-rf', workDir);
      });

      assertExtractedTests(workDir, suiteName);

      if (shouldAssertWebpack) assertWebpackBundle(workDir, suiteName);

      if (shouldBuildStorybook) {
        it('Storybook build should not fail', () => execSync('npx build-storybook', { cwd: workDir }));

        if (shouldAssertExtractedStories) assertExtractedStories(workDir);
      }
    });
  });
});
