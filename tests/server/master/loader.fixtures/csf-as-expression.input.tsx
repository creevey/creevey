// @ts-nocheck
import React from 'react';
import { Meta } from '@storybook/react'
import withFakeApi from './src/withFakeApi';
import Button from './src/Button';

const Kind = {
  title: 'Button',
  decorators: [withDarkTheme, withFakeApi()],
  component: Button,
} as Meta;

export default Kind;

export const Text = () => <button>Hello Button</button>;