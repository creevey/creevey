// @ts-nocheck
import { addParameters } from '@storybook/react';
import { DocsPage } from 'storybook-addon-deps/blocks';

addParameters({
  options: { showRoots: true },
  docs: { page: DocsPage },
});
addParameters({ creevey: { captureElement: '#test-root' } });