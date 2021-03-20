import { readdirSync, readFileSync, writeFileSync } from 'fs';
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

  readdirSync(`${__dirname}/storybook.fixtures`).forEach((testName) => {
    const mainJsPath = 'node_modules/creevey/node_modules/.cache/creevey/storybook/main.js';
    describe(testName, function () {
      before(function () {
        const tempDir = dirSync({ name: `creevey-${testName}` }).name;
        this.tempDir = tempDir;
        shell.cp('-r', `${__dirname}/storybook.fixtures/${testName}/{.,}*`, tempDir);
        shell.cp(`${__dirname}/approvals/${testName}/tests.json`, `${tempDir}/expected-tests.json`);
        shell.cp(`${__dirname}/approvals/${testName}/main.js`, `${tempDir}/expected-main.js`);
        shell.cp(`${__dirname}/load-tests.helper.js`, `${tempDir}/load.js`);
        shell.cp('creevey.tgz', tempDir);
        execSync('npm i ./creevey.tgz', { cwd: tempDir });
        execSync('npx creevey --webpack', { cwd: tempDir });
        execSync('node load', { cwd: tempDir });
        writeFileSync(
          `${tempDir}/${mainJsPath}`,
          readFileSync(`${tempDir}/${mainJsPath}`, { encoding: 'utf-8' })
            .replace(new RegExp(tempDir, 'g'), '.')
            .replace(/^\/\*!\*.*$\n\s{2}!\*{3}/gm, '/*')
            .replace(/\*{3}!$\n\s{2}\\\*+\/$/gm, '*/'),
        );
      });

      after(function () {
        if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");
        shell.cp(`${this.tempDir}/actual-tests.json`, `${__dirname}/approvals/${testName}/tests.json`);
        shell.cp(`${this.tempDir}/${mainJsPath}`, `${__dirname}/approvals/${testName}/main.js`);
        shell.rm('-rf', this.tempDir);
      });

      it('tests', async function () {
        if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");
        const expected = (await import(`${this.tempDir}/expected-tests.json`)) as unknown;
        const actual = (await import(`${this.tempDir}/actual-tests.json`)) as unknown;

        expect(actual).to.eql(expected);
      });

      it('webpack', function () {
        if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");

        const expected = readFileSync(`${this.tempDir}/expected-main.js`, { encoding: 'utf-8' });
        const actual = readFileSync(`${this.tempDir}/${mainJsPath}`, { encoding: 'utf-8' });

        expect(actual).to.equal(expected);
      });
    });
  });
});
