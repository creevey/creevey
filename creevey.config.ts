import path from 'path';
import { isInsideDocker } from './src/server/utils';
import { CreeveyConfig } from './src/types';

const config: CreeveyConfig = {
  useDocker: isInsideDocker ? false : true,
  maxRetries: process.env.CI ? 1 : 0,
  screenDir: path.join(__dirname, 'stories', 'images'),
  browsers: {
    chrome: {
      browserName: 'chrome',
      viewport: { width: 1024, height: 720 },
      webdriverCommand: [path.resolve('./chromedriver.exe')],
    },
    // ie11: {
    //   browserName: 'internet explorer',
    //   viewport: { width: 1024, height: 720 },
    // },
    firefox: {
      browserName: 'firefox',
      viewport: { width: 1024, height: 720 },
      webdriverCommand: [path.resolve('./geckodriver.exe')],
    },
  },
};

export default config;
