// @ts-nocheck
import React from 'react';
import Button from './src/Button';
import Input from './src/Input';

export default { title: 'Button' };

export const Text = () => <button>Hello Button</button>;
Text.story = {
  decorators: [storyFn => <center>{storyFn()}</center>],
  parameters: {
    component: Button,
    subcomponents: { input: Input },
    creevey: { captureElement: '#root' },
  },
};
Text.story = {
  decorators: [storyFn => <footer>{storyFn()}</footer>],
  parameters: {
    component: Input,
    subcomponents: { button: Button },
    creevey: { captureElement: null },
  },
};