import { addons } from '@storybook/addons';
import { registerCreevey } from './registerCreevey';

export const ADDON_ID = 'creevey';

addons.register(ADDON_ID, (api) => {
  void registerCreevey(api);
});
