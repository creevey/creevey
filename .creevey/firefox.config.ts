import { CreeveyConfig } from '../src/types';
import baseConfig from './base.config';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    firefox: {
      browserName: 'firefox',
      viewport: { width: 1024, height: 720 },
      gridUrl: 'http://selenoid__firefox:4444/wd/hub',
    },
  },
};

export default config;
