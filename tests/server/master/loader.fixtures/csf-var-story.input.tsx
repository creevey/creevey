// @ts-nocheck
import React from 'react';
import Button from './src/Button';

export default { title: 'Button' };

function story() { return <button>Hello Button</button> };
story.decorators = [storyFn => <center>{storyFn()}</center>];
story.parameters = {
  docsOnly: true,
  component: Button,
  creevey: { captureElement: '#root' },
};

export const Text = story;