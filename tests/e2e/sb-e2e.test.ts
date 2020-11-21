import { join } from 'path';
import { readdirSync } from 'fs';
import { dirSync } from 'tmp';
import shell, { ExecOptions } from 'shelljs';
import { describe } from 'mocha';
import { expect } from 'chai';
import { cpus } from 'os';

const execOptions = { silent: true, fatal: true };

const execAsync = (command: string, options: ExecOptions): Promise<void> => {
  return new Promise((resolve, reject) =>
    shell.exec(command, { ...options, async: true }).once('exit', (code) => (code == 0 ? resolve() : reject())),
  );
};

const parallelLimit = (tasks: Array<() => Promise<unknown>>, limit = cpus().length): Promise<void> => {
  return new Promise<void>((resolve) => {
    let inProgress = 0;
    const runTask = async (): Promise<void> => {
      if (inProgress > limit) return;
      const task = tasks.shift();
      if (task) {
        inProgress += 1;
        try {
          await task();
        } catch (_) {
          /* noop */
        }
        inProgress -= 1;
        void runTask();
      }
      if (inProgress == 0) resolve();
    };
    Array.from({ length: limit }).map(runTask);
  });
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
// TODO copy load.js
describe('Storybook E2E', function () {
  const tmpObj = dirSync({ prefix: 'creevey-' });
  const fixtures = readdirSync(join(__dirname, 'storybook.fixtures'));

  this.timeout('300s');

  before(async () => {
    shell.exec('yarn build', execOptions);
    shell.exec(`yarn pack -f ${join(tmpObj.name, 'creevey.tgz')}`, execOptions);
    shell.cp('-r', `${join(__dirname, 'storybook.fixtures', '*')}`, tmpObj.name);
    await parallelLimit(
      fixtures.map((test) => async () => {
        for (const command of ['npm i', 'npx creevey --webpack', 'node load']) {
          await execAsync(command, { ...execOptions, cwd: join(tmpObj.name, test) });
        }
      }),
    );
  });

  after(() => {
    shell.rm('-rf', tmpObj.name);
  });

  readdirSync(join(__dirname, 'storybook.fixtures'))
    .map((x) => x.split('-'))
    .forEach(([, version]) => {
      it(version, () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expected = require(`${tmpObj.name}/sb-${version}/expected.json`) as unknown;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const actual = require(`${tmpObj.name}/sb-${version}/actual.json`) as unknown;

        expect(actual).to.eql(expected);
      });
    });
});
