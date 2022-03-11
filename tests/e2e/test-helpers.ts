import path from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { ChildProcess } from 'child_process';
import { expect } from 'chai';
import { it } from 'mocha';
import shell, { ExecOptions } from 'shelljs';
import { removeProps } from '../../src/server/utils';
import { ServerTest } from '../../src/types';

function readMainJsBundle(workDir: string): string {
  const mainJsPath = 'node_modules/creevey/node_modules/.cache/creevey/storybook/main.js';
  const projectDir = workDir.startsWith(storybookDir) ? storybookDir : workDir;

  return readFileSync(`${workDir}/${mainJsPath}`, { encoding: 'utf-8' })
    .replace(new RegExp(projectDir, 'g'), '.')
    .replace(new RegExp(projectDir.replace(/[-/\s]/g, '_'), 'g'), '')
    .replace(/^\/\*!\*.*$\n\s{2}!\*{3}/gm, '/*')
    .replace(/\*{3}!$\n\s{2}\\\*+\/$/gm, '*/');
}

async function readTestsJson(workDir: string): Promise<unknown> {
  const projectDir = workDir.startsWith(storybookDir) ? storybookDir : workDir;

  const tests = ((await import(`${workDir}/tests.json`)) as { default: { [id: string]: ServerTest } }).default;
  Object.values(tests).forEach(
    ({ story: { parameters } }) =>
      (parameters.fileName = parameters.fileName.replace(new RegExp(projectDir, 'g'), '.')),
  );

  return tests;
}

export const storybookDir = path.join(__dirname, '../../../storybook');

export function execSync(command: string, options?: ExecOptions): void {
  const result = shell.exec(command, {
    fatal: true,
    env: { ...process.env, __CREEVEY_ENV__: 'test' },
    ...options,
    async: false,
  });
  if (result.code != 0) throw new Error(result.stderr);
}

export function prepareWorkDir(workDir: string, buildWebpack = true): void {
  execSync(`npm install serve ${path.join(__dirname, '/../../creevey.tgz')} --no-save`, { cwd: workDir });
  if (buildWebpack) execSync('npx creevey --webpack', { cwd: workDir });
}

export async function updateApprovals(workDir: string, suiteName: string, updateMainJS = true): Promise<void> {
  shell.mkdir('-p', `${__dirname}/approvals/${suiteName}`);
  writeFileSync(
    `${__dirname}/approvals/${suiteName}/tests.json`,
    JSON.stringify(await readTestsJson(workDir), null, 2),
  );
  if (updateMainJS) writeFileSync(`${__dirname}/approvals/${suiteName}/main.js`, readMainJsBundle(workDir));
  shell.rm('-f', `${workDir}/stories.json`);
}

export function assertExtractedTests(workDir: string, suiteName: string): void {
  it('extract tests', async function () {
    execSync('npx creevey --tests', { cwd: workDir });

    const expected = ((await import(`${__dirname}/approvals/${suiteName}/tests.json`)) as { default: unknown }).default;
    const actual = await readTestsJson(workDir);

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
    execSync('npx creevey --extract ./', { cwd: workDir });
    if (!existsSync(`${workDir}/storybook-static/stories.json`)) {
      execSync('npx sb extract storybook-static', { cwd: workDir });
    }

    const { default: expected } = (await import(`${workDir}/storybook-static/stories.json`)) as { default: unknown };
    const { default: actual } = (await import(`${workDir}/stories.json`)) as { default: unknown };

    [expected, actual].forEach((data) => {
      // TODO Fix args stories
      const excludedParams = ['fileName', '__isArgsStory', 'framework'];
      removeProps(data as Record<string, unknown>, ['error']);
      removeProps(data as Record<string, unknown>, ['globals']);
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
