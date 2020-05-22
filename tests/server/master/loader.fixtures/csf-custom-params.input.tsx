// @ts-nocheck
import React from 'react';
import Button from './src/Button';
import Input from './src/Input';

export default {
  title: 'Button',
  component: Button,
  subcomponents: { input: Input },
  parameters: {
    component: Button,
    subcomponents: { input: Input },
    creevey: { captureElement: '#root' },
  },
};

export const Text = () => <Button>Hello Button</Button>;
Text.story = {
  parameters: {
    component: Button,
    subcomponents: { input: Input },
    creevey: { captureElement: '#root' },
  },
};