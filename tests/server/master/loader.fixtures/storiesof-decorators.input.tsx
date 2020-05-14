// @ts-nocheck
import React from 'react';
import { storiesOf } from '@storybook/react';
import ThemeProvider from './src/ThemeProvider';
import withFakeApi from './src/withFakeApi';

const withDarkTheme = storyFn => <ThemeProvider name={'dark'}>{storyFn()}</ThemeProvider>;

storiesOf('Button', module)
  .addDecorator(withDarkTheme)
  .addDecorator(withFakeApi())
  .add('Text', () => <button>Hello Button</button>, { decorators: [storyFn => <center>{storyFn()}</center>] });