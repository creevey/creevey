import React from 'react';
import { addons, types } from '@storybook/addons';
import { Panel } from './Addon';

export const ADDON_ID = 'creevey';
const PANEL_ID = `${ADDON_ID}/panel`;

addons.register(ADDON_ID, (api) => {
  const title = 'Creevey';
  addons.addPanel(PANEL_ID, {
    title,
    type: types.PANEL,
    // TODO console.log(key) what is key?
    // eslint-disable-next-line react/display-name
    render: ({ active, key }) => React.createElement(Panel, { api, active, key }),
  });
});
