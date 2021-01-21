import { configure, addDecorator, addParameters } from '@storybook/react';
import { withCreevey } from 'creevey'

addDecorator(withCreevey())
addParameters({ creevey: { captureElement: 'root' }})

configure(require.context('../stories', true, /\.stories\.jsx$/), module);
