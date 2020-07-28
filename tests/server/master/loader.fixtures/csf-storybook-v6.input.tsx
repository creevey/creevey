// @ts-nocheck
import React from 'react';
import Button from './src/Button';
import Input from './src/Input';

export default { title: 'Button' };

export const Text = () => <Button>Hello Button</Button>;
Text.storyName = 'text button';
Text.decorators = [storyFn => <center>{storyFn()}</center>];
Text.parameters = {
  component: Button,
  subcomponents: { input: Input },
  creevey: { captureElement: '#root' },
};