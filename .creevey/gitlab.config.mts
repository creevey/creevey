import { CreeveyConfig } from '../src/types.js';
import baseConfig from './base.config.mjs';
import chrome from './browsers/chrome.mjs';
import firefox from './browsers/firefox.mjs';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome: { ...chrome, gridUrl: 'http://selenoid__chrome:4444' },
    firefox: { ...firefox, gridUrl: 'http://selenoid__firefox:4444/wd/hub' },
  },
};

export default config;
