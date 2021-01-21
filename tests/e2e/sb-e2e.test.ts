import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { dirSync } from 'tmp';
import shell, { ExecOptions } from 'shelljs';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

const execSync = (command: string, options?: ExecOptions): void => {
  const result = shell.exec(command, { fatal: true, ...options, async: false });
  if (result.code != 0) throw new Error(result.stderr);
};

// TODO tests
// StoriesOf - Parameters, global, kind, story
// CSF - Parameters, global, kind, story
// 6.0 - export global parameters
// SubKinds
// mdx
// from frameworks (angular, react, vue, nextjs, etc)
// Apply loader only for stories files

// 6.1 https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#single-story-hoisting

describe('Storybook E2E', function () {
  this.timeout('300s');

  before(() => {
    execSync('yarn build');
    execSync('yarn pack -f creevey.tgz');
  });

  readdirSync(join(__dirname, 'storybook.fixtures')).forEach((testName) => {
    describe(testName, function () {
      before(function () {
        const tempDir = dirSync({ name: `creevey-${testName}` }).name;
        this.tempDir = tempDir;
        shell.cp('-r', join(__dirname, 'storybook.fixtures', testName, '{.,}*'), tempDir);
        shell.cp(join(__dirname, 'load-tests.helper.js'), join(tempDir, 'load.js'));
        shell.cp('creevey.tgz', tempDir);
        execSync('npm i', { cwd: tempDir });
        execSync('npx creevey --webpack', { cwd: tempDir });
        execSync('node load', { cwd: tempDir });
      });

      after(function () {
        if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");
        shell.cp(
          join(this.tempDir, 'actual-tests.json'),
          join(__dirname, 'storybook.fixtures', testName, 'expected-tests.json'),
        );
        shell.cp(
          join(this.tempDir, 'node_modules', 'creevey', 'node_modules', '.cache', 'creevey', 'storybook', 'main.js'),
          join(__dirname, 'storybook.fixtures', testName, 'expected-main.js'),
        );
        shell.rm('-rf', this.tempDir);
      });

      it('tests', function () {
        if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expected = require(join(this.tempDir, 'expected-tests.json')) as unknown;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const actual = require(join(this.tempDir, 'actual-tests.json')) as unknown;

        expect(actual).to.eql(expected);
      });

      it('webpack', function () {
        if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");

        const expected = readFileSync(join(this.tempDir, 'expected-main.js'), { encoding: 'utf-8' });
        const actual = readFileSync(
          join(this.tempDir, 'node_modules', 'creevey', 'node_modules', '.cache', 'creevey', 'storybook', 'main.js'),
          { encoding: 'utf-8' },
        );

        expect(actual).to.equal(expected);
      });
    });
  });
});
