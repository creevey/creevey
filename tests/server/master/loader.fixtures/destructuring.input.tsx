// @ts-nocheck
import React from 'react';
import { storiesOf } from '@storybook/react';

import { someMethod } from './src/someMethod';

const { a, b, c } = someMethod();

storiesOf(module).add('Text', () => <button>Hello Button</button>);
