import { addons, types } from '@storybook/addons';
import { API } from '@storybook/api';
import React from 'react';
import { Addon } from './components/Addon';
import { Tools } from './components/Tools';
import { CreeveyManager } from './Manager';

export const ADDON_ID = 'creevey';

addons.register(ADDON_ID, (api) => {
  void registerCreeveyPanels(api);
});

export async function registerCreeveyPanels(storybookApi: API): Promise<void> {
  const manager = new CreeveyManager(storybookApi);

  addons.add(`${ADDON_ID}/panel/run`, {
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
    addons.add(panelId, {
      title,
      type: types.PANEL,
      paramKey: browser,

      // NOTE key = PANEL_ID needs to correct render button in addons panel
      // eslint-disable-next-line react/display-name
      render: ({ active }) =>
        React.createElement(Addon, {
          active,
          manager,
          browser,
        }),
    });
  });
}
