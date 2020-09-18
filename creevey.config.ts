import path from 'path';
import { CreeveyConfig } from './src/types';

const config: CreeveyConfig = {
  // useDocker: true,
  gridUrl: 'http://localhost:4444/wd/hub',
  storybookUrl: 'http://192.168.0.102:6006',
  screenDir: path.join(__dirname, 'stories', 'images'),
  browsers: {
    // chrome: {
    //   browserName: 'chrome',
    //   version: '84.0',
    //   viewport: { width: 1024, height: 720 },
    // },
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
