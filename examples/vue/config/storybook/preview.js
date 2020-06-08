import { addDecorator, addParameters } from '@storybook/vue';
import { withCreevey } from 'creevey';

addParameters({ creevey: { captureElement: '#root' } });
addDecorator(withCreevey());
