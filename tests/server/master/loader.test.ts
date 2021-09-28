import fs from 'fs';
import path from 'path';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import loader from '../../../src/server/loaders/webpack/creevey-loader';
import { FileType } from '../../../src/server/loaders/babel/helpers';

const testsToFileTypes: Partial<Record<string, FileType>> = {
  addDecorator: FileType.Preview,
  addParameters: FileType.Preview,
  'crucial-refs': FileType.Story,
  'csf-as-expression': FileType.Story,
  'csf-commonjs-loop': FileType.Story,
  'csf-commonjs': FileType.Story,
  'csf-commonjs2': FileType.Story,
  'csf-commonjs3': FileType.Story,
  'csf-component': FileType.Story,
  'csf-commonjs4': FileType.Story,
  'csf-custom-params': FileType.Story,
  'csf-decorators': FileType.Story,
  'csf-duplicate-assigns': FileType.Story,
  'csf-function': FileType.Story,
  'csf-import-story': FileType.Story,
  'csf-import-tests': FileType.Story,
  'csf-kind-as': FileType.Story,
  'csf-kind-props-assign': FileType.Story,
  'csf-multiple-decls': FileType.Story,
  'csf-object-assign': FileType.Story,
  'csf-reassign': FileType.Story,
  'csf-side-effects': FileType.Story,
  'csf-simple': FileType.Story,
  'csf-spread-params': FileType.Story,
  'csf-storybook-v6': FileType.Story,
  'csf-template': FileType.Story,
  'csf-tests': FileType.Story,
  'csf-var-kind': FileType.Story,
  'csf-var-story': FileType.Story,
  'csf-var-tests': FileType.Story,
  destructuring: FileType.Story,
  imports: FileType.Story,
  'interface-typeof': FileType.Story,
  'preview-side-effects': FileType.Preview,
  'preview-v6': FileType.Preview,
  recursion: FileType.Story,
  'storiesof-chain': FileType.Story,
  'storiesof-decorators': FileType.Story,
  'storiesof-import-tests': FileType.Story,
  'storiesof-loop-chain': FileType.Story,
  'storiesof-parameters': FileType.Story,
  'storiesof-simple': FileType.Story,
  'storiesof-tests': FileType.Story,
  'storiesof-var-tests': FileType.Story,
  'type-declarations': FileType.Story,
};

describe('loader', () => {
  const fixtures = path.join(__dirname, 'loader.fixtures');

  Array.from(new Set(fs.readdirSync(fixtures).map((filename) => filename.split('.')[0])))
    .map((testName) => {
      const input = fs.readFileSync(path.join(fixtures, `${testName}.input.tsx`), { encoding: 'utf-8' });
      const output = fs.readFileSync(path.join(fixtures, `${testName}.output.tsx`), { encoding: 'utf-8' });

      return { testName, input, output };
    })
    .forEach(({ testName, input, output }) =>
      it(testName, () => {
        process.env.CREEVEY_LOADER_FILE_TYPE = String(testsToFileTypes[testName] ?? FileType.Invalid);
        expect(loader(input).replace(/\r/g, '')).to.equal(output);
      }),
    );
});

// TODO Write more tests
/*
- CSF
  x with non-creevey params (options to include/exclude)
  - with non-story exports (include/exclude stories)
  x function declaration story (export function Text() {})
  - function expression (export const Text = TextButton)
  - with all reexport (export * from './TextButton')
  - with default reexport (export Text from './TextButton')
  - with export specifiers (export { Button, Input })
  x with multiple export declarations (export const Text = () => {}, Input = () => {})
  - declaration with destructuring (export const { Text } = stories)
  - with story fabric ??
  x default export without declaration (const Kind = {}; export default Kind;)
  x story args for 6.x
  x kind with `as` type cast (export default {} as Meta)
  - ts `as` expression (const Kind = {} as Meta)
  x spread parameters ({ ...parameters })

- StoriesOf
  - story decorator + params
  - with non-creevey params
  - with non-story exports
  x var storiesOf (const Button = storiesOf())
  - function declaration (.add('Text', function Text() {}))
  - function expression (.add('Text', Text))
  - with multiple storiesOf
  x storiesOf().addParameters()
  - storiesOf().loader
  - var parameters (addParameters(params) and add('Text', () => {}, params))

- MDX
  - MDXContent function

x commonjs

- Optional
  - Complex example
  - Other Frameworks?
  - Combination CSF and StoriesOf
*/
