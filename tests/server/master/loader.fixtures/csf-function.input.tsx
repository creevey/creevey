// @ts-nocheck
import React from 'react';
import Button from './src/Button';

export default { title: 'Button' };

export function Text() { return <button>Hello Button</button> };
Text.decorators = [storyFn => <center>{storyFn()}</center>];
Text.parameters = {
  docsOnly: true,
  component: Button,
  creevey: { captureElement: '#root' },
};