import React from 'react';
import { Addon_TypesEnum } from '@storybook/types';
import { addons, API } from '@storybook/manager-api';
import { Addon } from './components/Addon.js';
import { Tools } from './components/Tools.js';
import { CreeveyController, ADDON_ID } from './controller.js';

// TODO Take api from `import { useGlobals, useStorybookApi } from '@storybook/manager-api';`
addons.register(ADDON_ID, (api) => {
  void registerCreeveyPanels(api);
});

async function registerCreeveyPanels(storybookApi: API): Promise<void> {
  const controller = new CreeveyController(storybookApi);

  addons.add(`${ADDON_ID}/panel/run`, {
    title: `Creevey/Run`,
    match: ({ viewMode }) => !!(viewMode && /^story$/.exec(viewMode)),
    type: Addon_TypesEnum.TOOL,

    render: () => React.createElement(Tools, { controller }),
  });
  await controller.initAll();
  const browsers = controller.getBrowsers();

  browsers.forEach((browser) => {
    const panelId = `${ADDON_ID}/panel/${browser}`;
    const title = controller.getTabTitle(browser);
    addons.add(panelId, {
      title,
      type: Addon_TypesEnum.PANEL,
      paramKey: browser,

      // NOTE key = PANEL_ID needs to correct render button in addons panel

      render: ({ active }) =>
        React.createElement(Addon, {
          active,
          controller,
          browser,
        }),
    });
  });
}
