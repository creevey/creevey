import { CreeveyConfig } from '../src/types';
import baseConfig from './base.config';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome: {
      browserName: 'chrome',
      viewport: { width: 1024, height: 768 },
      gridUrl: 'http://selenoid__chrome:4444',
    },
  },
};

export default config;
