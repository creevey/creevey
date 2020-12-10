import path from 'path';
import { CreeveyConfig } from './src/types';

const config: CreeveyConfig = {
  useDocker: process.env.CI ? false : true,
  maxRetries: process.env.CI ? 1 : 0,
  screenDir: path.join(__dirname, 'stories', 'images'),
  browsers: {
    chrome: {
      browserName: 'chrome',
      webdriverCommand: ['chromedriver'],
      viewport: { width: 1024, height: 720 },
    },
    // ie11: {
    //   browserName: 'internet explorer',
    //   viewport: { width: 1024, height: 720 },
    // },
    firefox: {
      browserName: 'firefox',
      webdriverCommand: ['geckodriver'],
      viewport: { width: 1024, height: 720 },
    },
  },
};

export default config;
