import { CreeveyConfig } from '../src/types';
import baseConfig from './base.config';
import chrome from './chrome.config';
import firefox from './firefox.config';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome,
    firefox,
  },
};

export default config;
