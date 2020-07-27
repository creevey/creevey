import path from 'path';
import { CreeveyConfig } from './src/types';

const config: CreeveyConfig = {
  gridUrl: 'http://192.168.0.106:4444/wd/hub',
  storybookUrl: 'http://192.168.248.32:6006',
  screenDir: path.join(__dirname, 'stories', 'images'),
  browsers: {
    chrome: {
      browserName: 'chrome',
      viewport: { width: 1024, height: 720 },
    },
    // ie11: {
    //   browserName: 'internet explorer',
    //   viewport: { width: 1024, height: 720 },
    // },
    firefox: {
      browserName: 'firefox',
      viewport: { width: 1024, height: 720 },
    },
  },
};

export default config;
