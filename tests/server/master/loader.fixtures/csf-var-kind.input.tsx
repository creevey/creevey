// @ts-nocheck
import React from 'react';
import ThemeProvider from './src/ThemeProvider';
import withFakeApi from './src/withFakeApi';
import Button from './src/Button';
import Input from './src/Input';

const withDarkTheme = storyFn => <ThemeProvider name={'dark'}>{storyFn()}</ThemeProvider>;

const Kind = {
  title: 'Button',
  decorators: [withDarkTheme, withFakeApi()],
  component: Button,
  subcomponents: { input: Input },
};
export default Kind;

export const Text = () => <button>Hello Button</button>;