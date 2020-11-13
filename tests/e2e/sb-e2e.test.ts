import { join } from 'path';
import { readdirSync } from 'fs';
import { dirSync } from 'tmp';
import shell from 'shelljs';
import { beforeEach, describe } from 'mocha';
import { expect } from 'chai';

// TODO tests
// StoriesOf - Parameters, global, kind, story
// CSF - Parameters, global, kind, story
// 6.0 - export global parameters
// SubKinds
// mdx

// 6.1 https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#single-story-hoisting

// TODO Remove hooks prop from stories for >= 5.2

// TODO stdout and stderr to log file
// todo copy load.js
describe('Storybook E2E', function () {
  const tmpObj = dirSync({ prefix: 'creevey-' });
  const initialDir = process.cwd();

  this.timeout('60s');

  before(() => {
    shell.exec('yarn build');
    shell.exec(`yarn pack -f ${join(tmpObj.name, 'creevey.tgz')}`);
    shell.cp('-r', `${join(__dirname, 'storybook.fixtures', '*')}`, tmpObj.name);
    shell.cd(tmpObj.name);
  });

  after(() => {
    shell.cd(initialDir);
    // shell.rm('-rf', tmpObj.name);
  });

  beforeEach(function () {
    const version = this.currentTest?.title;
    if (!version) return;
    shell.cd(join(tmpObj.name, `sb-${version}`));
    shell.exec('npm i');
    shell.exec('npx creevey --webpack');
    shell.exec('node load');
  });

  readdirSync(join(__dirname, 'storybook.fixtures'))
    .map((x) => x.split('-'))
    .forEach(([, version]) => {
      if (version == '4.0') {
        /*
          [CreeveyWebpack]: Starting with pid 1005279
          info => Loading presets
          info => Using base config because react-scripts is not installed.
          info => Using default webpack setup based on "create-react-app".
          info => Using base config because react-scripts is not installed.

          WARNING: We noticed you're using the `useBuiltIns` option without declaring a core-js version. Currently, we assume version 2.x when no version is passed. Since this default version will likely change in future versions of Babel, we recommend explicitly setting the core-js version you are using via the `corejs` option.

          You should also be sure that the version you pass to the `corejs` option matches the version specified in your `package.json`'s `dependencies` section. If it doesn't, you need to run one of the following commands:

            npm install --save core-js@2    npm install --save core-js@3
            yarn add core-js@2              yarn add core-js@3

          Error: Cannot find module '/tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/node_modules/.cache/creevey/storybook/main.js'
          Require stack:
          - /tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/node_modules/creevey/lib/server/stories.js
          - /tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/load.js
              at Function.Module._resolveFilename (internal/modules/cjs/loader.js:831:15)
              at Function.Module._load (internal/modules/cjs/loader.js:687:27)
              at Module.require (internal/modules/cjs/loader.js:903:19)
              at require (internal/modules/cjs/helpers.js:74:18)
              at /tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/node_modules/creevey/lib/server/stories.js:207:5
              at new Promise (<anonymous>)
              at loadStorybookBundle (/tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/node_modules/creevey/lib/server/stories.js:196:10)
              at processTicksAndRejections (internal/process/task_queues.js:97:5)
              at async Object.loadTestsFromStories (/tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/node_modules/creevey/lib/server/stories.js:216:19) {
            code: 'MODULE_NOT_FOUND',
            requireStack: [
              '/tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/node_modules/creevey/lib/server/stories.js',
              '/tmp/creevey--1005010-13Ihc6sUUlWU/sb-4.1/load.js'
            ]
          }
*/
        return;
      }
      if (version == '4.1') {
        it(version, () => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const expected = require(`${tmpObj.name}/sb-${version}/expected.json`) as unknown;
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const actual = require(`${tmpObj.name}/sb-${version}/actual.json`) as unknown;

          expect(actual).to.eql(expected);
        });
      }
    });
});
