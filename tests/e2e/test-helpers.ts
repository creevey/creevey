import { writeFileSync, readFileSync } from 'fs';
import { ChildProcess } from 'child_process';
import { expect } from 'chai';
import { it } from 'mocha';
import shell, { ExecOptions } from 'shelljs';
import { removeProps } from '../../src/server/utils';

function readMainJsBundle(workDir: string): string {
  const mainJsPath = 'node_modules/creevey/node_modules/.cache/creevey/storybook/main.js';

  return readFileSync(`${workDir}/${mainJsPath}`, { encoding: 'utf-8' })
    .replace(new RegExp(workDir.startsWith(storybookDir) ? storybookDir : workDir, 'g'), '.')
    .replace(/^\/\*!\*.*$\n\s{2}!\*{3}/gm, '/*')
    .replace(/\*{3}!$\n\s{2}\\\*+\/$/gm, '*/');
}

export const storybookDir = `${__dirname}../../../storybook`;

export function execSync(command: string, options?: ExecOptions): void {
  const result = shell.exec(command, {
    fatal: true,
    env: { ...process.env, __CREEVEY_ENV__: 'test' },
    ...options,
    async: false,
  });
  if (result.code != 0) throw new Error(result.stderr);
}

export function prepareWorkDir(workDir: string): void {
  execSync(`npm install serve ${__dirname}/../../creevey.tgz --no-save`, { cwd: workDir });
  execSync('npx creevey --webpack', { cwd: workDir });
}

export function updateApprovals(workDir: string, suiteName: string): void {
  shell.mkdir('-p', `${__dirname}/approvals/${suiteName}`);
  shell.mv(`${workDir}/tests.json`, `${__dirname}/approvals/${suiteName}/tests.json`);
  shell.rm('-f', `${workDir}/stories.json`);
  writeFileSync(`${__dirname}/approvals/${suiteName}/main.js`, readMainJsBundle(workDir));
}

export function assertExtractedTests(workDir: string, suiteName: string): void {
  it('extract tests', async function () {
    execSync('npx creevey --extract=tests', { cwd: workDir });

    const expected = (await import(`${__dirname}/approvals/${suiteName}/tests.json`)) as unknown;
    const actual = (await import(`${workDir}/tests.json`)) as unknown;

    expect(actual).to.eql(expected);
  });
}

export function assertWebpackBundle(workDir: string, suiteName: string): void {
  it('build webpack', function () {
    const expected = readFileSync(`${__dirname}/approvals/${suiteName}/main.js`, { encoding: 'utf-8' });
    const actual = readMainJsBundle(workDir);

    expect(actual).to.equal(expected);
  });
}

export function assertExtractedStories(workDir: string): void {
  it('extract stories', async function () {
    execSync('npx creevey --extract=stories', { cwd: workDir });
    execSync('npx sb extract storybook-static', { cwd: workDir });

    const expected = (await import(`${workDir}/storybook-static/stories.json`)) as unknown;
    const actual = (await import(`${workDir}/stories.json`)) as unknown;

    [expected, actual].forEach((data) => {
      const excludedParams = ['fileName', '__isArgsStory'];
      removeProps(data as Record<string, unknown>, ['kindParameters', () => true, 'fileName']);
      removeProps(data as Record<string, unknown>, [
        'stories',
        () => true,
        'parameters',
        (key) => excludedParams.includes(key),
      ]);
    });

    expect(actual).to.eql(expected);
  });
}

// TODO Copy images to approvals, save report for artifact
export function assertScreenshots(workDir: string): void {
  let serveProcess: ChildProcess | null = null;

  after(function () {
    serveProcess?.kill();
  });

  it('ui tests', function () {
    serveProcess = shell.exec('npx serve -p 6006 storybook-static', { cwd: workDir, async: true });

    execSync('npx creevey', { cwd: workDir });
  });
}
