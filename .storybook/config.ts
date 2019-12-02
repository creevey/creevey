import { configure, addDecorator } from '@storybook/react';
import { withCreevey } from '../src/storybook';

addDecorator(withCreevey({ captureElement: '#root' }));

configure(require.context('../stories', true, /\.stories\.tsx$/), module);
