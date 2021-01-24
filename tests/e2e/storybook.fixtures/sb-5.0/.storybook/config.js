import { configure, addDecorator, addParameters } from '@storybook/react';
import { withCreevey } from 'creevey'

addDecorator(withCreevey())
addParameters({ creevey: { captureElement: 'root' }})

function loadStories() {
  const req = require.context('../stories', true, /\.stories\.jsx$/);
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
