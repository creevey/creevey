// @ts-nocheck
import React from 'react';
import { Meta } from '@storybook/react'
import withFakeApi from './src/withFakeApi';
import Button from './src/Button';

export default {
  title: 'Button',
  decorators: [withDarkTheme, withFakeApi()],
  component: Button,
} as Meta;

export const Text = () => <button>Hello Button</button>;