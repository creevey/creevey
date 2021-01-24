import React from 'react';
import { storiesOf } from '@storybook/react';

function click() {}

function configure() { return click }
function addDecorator() { return click }
function addParameters() { return click }

storiesOf('KindA', module)
  .add('StoryA', () => <div />)
  .add('configure', () => <div />, { creevey: { tests: { click: configure() } } })
  .add('addDecorator', () => <div />, { creevey: { tests: { click: addDecorator() } } })
  .add('addParameters', () => <div />, { creevey: { tests: { click: addParameters() } } })
