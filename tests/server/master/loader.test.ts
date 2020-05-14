import fs from 'fs';
import path from 'path';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import loader from '../../../src/server/master/loader';

describe('loader', () => {
  const fixtures = path.join(__dirname, 'loader.fixtures');

  Array.from(new Set(fs.readdirSync(fixtures).map((filename) => filename.split('.')[0])))
    .map((testName) => {
      const input = fs.readFileSync(path.join(fixtures, `${testName}.input.tsx`), 'utf-8');
      const output = fs.readFileSync(path.join(fixtures, `${testName}.output.tsx`), 'utf-8');

      return { testName, input, output };
    })
    .forEach(({ testName, input, output }) => it(testName, () => expect(loader(input)).to.equal(output)));
});

// TODO Can't use decorators and decorators-legacy plugins in same time
// TODO Write more tests
/*
- Syntax plugins
  - class properties
  - decorators
  x Typescript

- CSF
  - with non-creevey params (options to include/exclude)
  - with non-story exports
  - function declaration story (export function Text() {})
  - function expression (export const Text = TextButton)
  - with reexport (export Text from './TextButton')
  - with export specifiers (export { Button, Input })
  - with multiple export declarations (export const Text = () => {}, Input = () => {})
  - declaration with destructuring (export const { Text } = stories)
  - with story fabric ??

- StoriesOf
  - story decorator + params
  - with non-creevey params
  - with non-story exports
  - var storiesOf (const Button = storiesOf())
  - function declaration (.add('Text', function Text() {}))
  - function expression (.add('Text', Text))
  - with multiple storiesOf

- commonjs

- Optional
  - Complex example
  - Other Frameworks?
  - Combination CSF and StoriesOf
*/
