import { CreeveyConfig } from '../src/types';
import baseConfig from './base.config';
import chrome from './chrome.config';
import firefox from './firefox.config';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome: { ...chrome, gridUrl: 'http://selenoid__chrome:4444' },
    firefox: { ...firefox, gridUrl: 'http://selenoid__firefox:4444/wd/hub' },
  },
};

export default config;
