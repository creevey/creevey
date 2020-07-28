// @ts-nocheck
import React from 'react';
import Button from './src/Button';
import Input from './src/Input';

export default { title: 'Button' };

export const Text = () => <button>Hello Button</button>, Icon = () => <button>😅🚀🐱‍🐉</button>;
Text.story = {
  parameters: {
    component: Button,
    creevey: { captureElement: '#root' },
  },
};
Icon.story = {
  parameters: {
    component: Input,
    creevey: { captureElement: '#root' },
  },
};