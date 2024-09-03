import { CreeveyConfig } from '../src/types.js';
import baseConfig from './base.config.mjs';
import chrome from './browsers/chrome.mjs';
import firefox from './browsers/firefox.mjs';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome,
    firefox,
  },
};

export default config;
