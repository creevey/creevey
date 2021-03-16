// @ts-nocheck
import React from 'react';
import Button from './src/Button';
import Input from './src/Input';

const parameters = {
  component: Button,
  subcomponents: { input: Input },
  creevey: { captureElement: '#root' },
};

export default {
  title: 'Button',
  ...{
    component: Button,
    subcomponents: { input: Input },
    parameters: { ...parameters },
  },
};

export const Text = () => <Button>Hello Button</Button>;
Text.parameters = {
  component: Button,
  ...{
    subcomponents: { input: Input },
    creevey: { captureElement: '#root' },
  },
};