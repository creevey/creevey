import { CreeveyConfig } from '../src/types';
import baseConfig from './base.config';
import chrome from './browsers/chrome';
import firefox from './browsers/firefox';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome,
    firefox,
  },
};

export default config;
