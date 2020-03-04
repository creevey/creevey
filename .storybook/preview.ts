import { addDecorator } from '@storybook/react';
import { withCreevey } from '../src/storybook';

addDecorator(withCreevey({ captureElement: '#root' }));
