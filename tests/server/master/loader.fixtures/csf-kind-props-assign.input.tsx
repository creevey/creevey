// @ts-nocheck
import React from 'react';
import { Meta } from '@storybook/react';
import Button from './src/Button';

const Kind: Meta = { title: 'Button' };

export const Text = () => <button>Hello Button</button>;

Kind.component = Button;
Kind.loaders = [async () => ({ foo: 1 })];
Kind.parameters = Kind.parameters || { };
Kind.parameters.creevey = { captureElement: '#root' };
Kind.parameters.docs = {
  ...(Kind.parameters.docs || {}),
  button: () => (<button>Page</button>),
};

export default Kind;