import { CreeveyConfig } from '../src/types.js';
import baseConfig from './base.config.js';
import chrome from './browsers/chrome.js';
import firefox from './browsers/firefox.js';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome: { ...chrome, gridUrl: 'http://selenoid__chrome:4444' },
    firefox: { ...firefox, gridUrl: 'http://selenoid__firefox:4444/wd/hub' },
  },
};

export default config;
