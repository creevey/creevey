// @ts-nocheck
import React from 'react';
import { storiesOf } from '@storybook/react';

storiesOf('Button', module)
  .addParameters({
    options: { showRoots: true },
    docs: { page: DocsPage },
    creevey: { captureElement: '#test-root' }
  })
  .add('Text', () => <button>Hello Button</button>);