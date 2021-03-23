import { expect } from 'chai';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { after, before, describe, it } from 'mocha';
import shell, { ExecOptions } from 'shelljs';
import { dirSync } from 'tmp';

const execSync = (command: string, options?: ExecOptions): void => {
  const result = shell.exec(command, { fatal: true, ...options, async: false });
  if (result.code != 0) throw new Error(result.stderr);
};

export function createTests(fixturesDirectory: string, additionalTests?: (suiteName: string) => void): void {
  readdirSync(`${__dirname}/${fixturesDirectory}`).forEach((suiteName) => {
    const mainJsPath = 'node_modules/creevey/node_modules/.cache/creevey/storybook/main.js';
    describe(suiteName, function () {
      before(function () {
        const tempDir = dirSync({ name: `creevey-${suiteName}` }).name;
        this.tempDir = tempDir;
        shell.cp('-r', `${__dirname}/${fixturesDirectory}/${suiteName}/{.,}*`, tempDir);
        shell.cp(`${__dirname}/approvals/${suiteName}/tests.json`, `${tempDir}/expected-tests.json`);
        shell.cp(`${__dirname}/approvals/${suiteName}/main.js`, `${tempDir}/expected-main.js`);
        shell.cp(`${__dirname}/load-helper.js`, `${tempDir}/load.js`);
        shell.cp('creevey.tgz', tempDir);
        execSync('npm i', { cwd: tempDir });
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

      additionalTests?.(suiteName);

      after(function () {
        if (!('tempDir' in this) || typeof this.tempDir != 'string') throw new Error("Can't get temp directory path");
        shell.cp(`${this.tempDir}/actual-tests.json`, `${__dirname}/approvals/${suiteName}/tests.json`);
        shell.cp(`${this.tempDir}/${mainJsPath}`, `${__dirname}/approvals/${suiteName}/main.js`);
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
}
