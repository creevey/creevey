import { BrowserConfig, CreeveyConfig } from '../src/types';
import baseConfig from './base.config';
import chromeConfig from './chrome.config';
import firefoxConfig from './firefox.config';

Reflect.deleteProperty(chromeConfig.browsers.chrome as BrowserConfig, 'gridUrl');
Reflect.deleteProperty(firefoxConfig.browsers.firefox as BrowserConfig, 'gridUrl');

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    ...chromeConfig.browsers,
    ...firefoxConfig.browsers,
  },
};

export default config;
