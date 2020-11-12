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
    shell.rm('-rf', tmpObj.name);
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
      if (version == '4.0' || version == '4.1') {
        /*
          [CreeveyWebpack]: Starting with pid 958095
          [FAIL:958095] Error: Cannot find module '@storybook/core/dist/server/preview/preview-preset'
          Require stack:
          - /tmp/creevey--956918-WKbyjnaGyvj2/sb-4.0/node_modules/creevey/lib/server/master/webpack.js
          - /tmp/creevey--956918-WKbyjnaGyvj2/sb-4.0/node_modules/creevey/lib/server/index.js
          - /tmp/creevey--956918-WKbyjnaGyvj2/sb-4.0/node_modules/creevey/lib/creevey.js
          - /tmp/creevey--956918-WKbyjnaGyvj2/sb-4.0/node_modules/creevey/lib/cli.js
              at Function.Module._resolveFilename (internal/modules/cjs/loader.js:831:15)
              at Function.resolve (internal/modules/cjs/helpers.js:80:19)
              at Object.compile [as default] (/tmp/creevey--956918-WKbyjnaGyvj2/sb-4.0/node_modules/creevey/lib/server/master/webpack.js:112:27)
        */
        return;
      }
      if (version == '5.0') {
        /*
        TypeError: Function.prototype.apply was called on undefined, which is a undefined and not a function
            at configure (/home/ki/Projects/creevey/tests/e2e/storybook.fixtures/sb-5.0/node_modules/creevey/lib/server/storybook.js:40:35)
            at Module.eval (webpack:///./.storybook/config.js?:4:67)
            at eval (webpack:///./.storybook/config.js?:5:30)
            at Module../.storybook/config.js (/home/ki/Projects/creevey/tests/e2e/storybook.fixtures/sb-5.0/node_modules/.cache/creevey/storybook/main.js:97:1)
            at Object.apply (webpack:///./node_modules/creevey/lib/server/master/dummy-hmr.js?:38:21)
            at __webpack_require__ (/home/ki/Projects/creevey/tests/e2e/storybook.fixtures/sb-5.0/node_modules/.cache/creevey/storybook/main.js:20:30)
            at eval (webpack:///multi_./node_modules/creevey/lib/server/master/dummy-hmr_./node_modules/@storybook/core/dist/server/common/polyfills.js_./node_modules/@storybook/core/dist/server/preview/globals.js_./.storybook/config.js?:4:18)
            at Object.0 (/home/ki/Projects/creevey/tests/e2e/storybook.fixtures/sb-5.0/node_modules/.cache/creevey/storybook/main.js:176:1)
            at __webpack_require__ (/home/ki/Projects/creevey/tests/e2e/storybook.fixtures/sb-5.0/node_modules/.cache/creevey/storybook/main.js:20:30)
            at /home/ki/Projects/creevey/tests/e2e/storybook.fixtures/sb-5.0/node_modules/.cache/creevey/storybook/main.js:84:18
         */
        return;
      }
      if (version == '5.2') {
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
