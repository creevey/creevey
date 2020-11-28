import { join } from 'path';
import { readdirSync } from 'fs';
import { dirSync } from 'tmp';
import shell, { ExecOptions } from 'shelljs';
import { describe, beforeEach, afterEach, it, before } from 'mocha';
import { expect } from 'chai';

const execSync = (command: string, options?: ExecOptions): void => {
  const result = shell.exec(command, { silent: true, fatal: true, ...options, async: false });
  if (result.code != 0) throw new Error(result.stderr);
};

// TODO tests
// StoriesOf - Parameters, global, kind, story
// CSF - Parameters, global, kind, story
// 6.0 - export global parameters
// SubKinds
// mdx
// from frameworks (angular, react, vue, nextjs, etc)

// 6.1 https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#single-story-hoisting

// TODO Remove hooks prop from stories for >= 5.2
describe('Storybook E2E', function () {
  this.timeout('300s');

  before(() => {
    execSync('yarn build');
    execSync('yarn pack -f creevey.tgz');
  });

  beforeEach(function () {
    if (!this.currentTest) throw new Error("Can't get test name");

    const tempDir = dirSync({ prefix: 'creevey-' }).name;
    this.tempDir = tempDir;
    shell.cp('-r', join(__dirname, 'storybook.fixtures', this.currentTest.title, '{.,}*'), tempDir);
    shell.cp(join(__dirname, 'load-tests.helper.js'), join(tempDir, 'load.js'));
    shell.cp('creevey.tgz', tempDir);
    execSync('npm i', { cwd: tempDir });
    execSync('npx creevey --webpack', { cwd: tempDir });
    execSync('node load', { cwd: tempDir });
  });

  afterEach(function () {
    if (!this.currentTest) throw new Error("Can't get test name");
    if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");
    try {
      shell.cp(
        join(this.tempDir, 'actual.json'),
        join(__dirname, 'storybook.fixtures', this.currentTest.title, 'expect.json'),
      );
    } catch (_) {
      /* noop */
    }
    shell.rm('-rf', this.tempDir);
  });

  readdirSync(join(__dirname, 'storybook.fixtures')).forEach((testName) => {
    it(testName, function () {
      if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const expected = require(`${this.tempDir}/expect.json`) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const actual = require(`${this.tempDir}/actual.json`) as unknown;

      expect(actual).to.eql(expected);
    });
  });
});
