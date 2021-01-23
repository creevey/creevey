import addons, { types } from '@storybook/addons';
import { API } from '@storybook/api';
import React from 'react';
import { Addon } from './Addon';
import { Tools } from './components/Tabs/Tools';
import { CreeveyManager } from './Manager';
import { ADDON_ID } from './register';

export async function registerCreevey(storybookApi: API): Promise<void> {
  const manager = new CreeveyManager(storybookApi);

  addons.addPanel(`${ADDON_ID}/panel/run`, {
    title: `Creevey/Run`,
    match: ({ viewMode }) => !!(viewMode && /^story$/.exec(viewMode)),
    type: types.TOOL,
    // eslint-disable-next-line react/display-name
    render: () => React.createElement(Tools, { manager }),
  });
  await manager.initAll();
  const browsers = manager.getBrowsers();

  browsers.forEach((browser) => {
    const panelId = `${ADDON_ID}/panel/${browser}`;
    const title = manager.getTabTitle(browser);
    addons.addPanel(panelId, {
      title,
      type: types.PANEL,
      paramKey: browser,

      // NOTE key = PANEL_ID needs to correct render button in addons panel
      // eslint-disable-next-line react/display-name
      render: ({ active, key }) =>
        React.createElement(Addon, {
          active,
          key,
          manager,
          browser,
        }),
    });
  });
}
