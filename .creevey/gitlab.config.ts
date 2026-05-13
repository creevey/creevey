import { CreeveyConfig } from '../src/types.js';
import baseConfig from './base.config.js';
import chrome from './browsers/chrome.js';
import firefox from './browsers/firefox.js';

const config: CreeveyConfig = {
  ...baseConfig,
  reporter: 'junit',
  useDocker: false,
  browsers: {
    chrome,
    firefox,
  },
};

export default config;
