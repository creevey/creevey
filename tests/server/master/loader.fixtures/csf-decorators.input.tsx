// @ts-nocheck
import React from 'react';
import ThemeProvider from './src/ThemeProvider';
import withFakeApi from './src/withFakeApi';

const withDarkTheme = storyFn => <ThemeProvider name={'dark'}>{storyFn()}</ThemeProvider>;

export default {
  title: 'Button',
  decorators: [withDarkTheme, withFakeApi()],
};

export const Text = () => <button>Hello Button</button>;
Text.story = { decorators: [storyFn => <center>{storyFn()}</center>] };