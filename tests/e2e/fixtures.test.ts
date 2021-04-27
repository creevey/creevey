import { readdirSync } from 'fs';
import { describe } from 'mocha';
import shell from 'shelljs';
import { dirSync } from 'tmp';
import { assertExtractedTests, assertWebpackBundle, execSync, prepareWorkDir, updateApprovals } from './test-helpers';

// TODO tests
// StoriesOf - Parameters, global, kind, story
// CSF - Parameters, global, kind, story
// 6.0 - export global parameters
// SubKinds
// mdx
// from frameworks (angular, react, vue, nextjs, etc)
// Apply loader only for stories files

// 6.1 https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#single-story-hoisting

describe('Storybook Fixtures E2E', function () {
  this.timeout('300s');

  readdirSync(`${__dirname}/storybook.fixtures`).forEach((suiteName) => {
    describe(suiteName, function () {
      const workDir = dirSync({ prefix: `creevey-${suiteName}` }).name;

      before(function () {
        shell.cp('-r', `${__dirname}/storybook.fixtures/${suiteName}/{.,}*`, workDir);
        execSync('npm install', { cwd: workDir });
        prepareWorkDir(workDir);
      });

      after(async function () {
        await updateApprovals(workDir, suiteName);
        shell.rm('-rf', workDir);
      });

      assertExtractedTests(workDir, suiteName);

      assertWebpackBundle(workDir, suiteName);
    });
  });
});
