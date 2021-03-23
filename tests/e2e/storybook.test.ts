import { describe } from 'mocha';
import { createTests } from './test-helper';

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

  createTests('storybook.fixtures');
});
