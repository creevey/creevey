// @ts-nocheck
import React from 'react';
import Button from './src/Button';

export default { title: 'Button' };

export const Text = Object.assign(
  () => <button>Hello Button</button>,
  {
    decorators: [storyFn => <center>{storyFn()}</center>],
    parameters: {
      docsOnly: true,
      component: Button,
      creevey: { captureElement: '#root' },
    }
  }
);