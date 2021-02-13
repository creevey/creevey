import { CreeveyConfig } from '../src/types';
import baseConfig from './base.config';
import chromeConfig from './chrome.config';
import firefoxConfig from './firefox.config';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    ...chromeConfig.browsers,
    ...firefoxConfig.browsers,
  },
};

export default config;
