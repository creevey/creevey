import React from 'react';
import { addons, types } from '@storybook/addons';
import { Panel } from './Addon';

export const ADDON_ID = 'creevey';
const PANEL_ID = `${ADDON_ID}/panel`;

addons.register(ADDON_ID, (api) => {
  const title = 'Creevey';
  addons.add(PANEL_ID, {
    title,
    type: types.TAB,
    route: ({ storyId }) => `/${ADDON_ID}/${storyId || ''}`,
    match: ({ viewMode }) => viewMode === ADDON_ID,
    // eslint-disable-next-line react/display-name
    render: ({ active, key }) => <Panel api={api} active={active} key={key} />,
  });
});
