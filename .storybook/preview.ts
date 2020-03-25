import { addDecorator, addParameters } from '@storybook/react';
import { withCreevey } from '../src/storybook';

addParameters({ creevey: { captureElement: '#root' } });
addDecorator(withCreevey());
