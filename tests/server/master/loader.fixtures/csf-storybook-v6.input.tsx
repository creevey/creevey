// @ts-nocheck
import React from 'react';
import Button from './src/Button';
import Input from './src/Input';

export default {
  title: 'Button',
  loaders: [async () => ({ message: (await fetch('https://example.com').json()).payload })],
};

export const Text = () => <Button>Hello Button</Button>;
Text.storyName = 'text button';
Text.decorators = [storyFn => <center>{storyFn()}</center>];
Text.parameters = {
  docsOnly: true,
  component: Button,
  subcomponents: { input: Input },
  creevey: { captureElement: '#root' },
};
Text.loaders = [async () => ({ message: (await fetch('https://example.com').json()).payload })];