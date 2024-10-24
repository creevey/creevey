import { playwrightBrowser } from '../src/index.js';
import { CreeveyConfig } from '../src/types.js';
import baseConfig from './base.config.mjs';
import chrome from './browsers/chrome.mjs';
// import firefox from './browsers/firefox.mjs';

const config: CreeveyConfig = {
  ...baseConfig,
  storybookUrl: 'http://192.168.0.103:6006',
  webdriver: playwrightBrowser,
  browsers: {
    chrome,
    // firefox,
  },
};

export default config;
