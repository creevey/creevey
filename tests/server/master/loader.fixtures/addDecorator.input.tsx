// @ts-nocheck
import React from 'react';
import { withCreevey } from 'creevey';
import { addDecorator } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';

import { GlobalStyle } from '../src/components/shared/global';

addDecorator(withA11y);
addDecorator(story => (
  <>
    <GlobalStyle />
    {story()}
  </>
));
addDecorator(withCreevey());