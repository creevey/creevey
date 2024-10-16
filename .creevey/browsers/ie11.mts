import { BrowserConfig } from '../../src/types.js';

const config: BrowserConfig = {
  limit: 5,
  gridUrl: 'https://hub-cloud.browserstack.com/wd/hub',
  browserName: 'IE',
  browserVersion: '11.0',
  viewport: { width: 1024, height: 768 },
  'bstack:options': {
    os: 'Windows',
    osVersion: '10',
    local: 'true',
    seleniumVersion: '4.0.0-beta-1',
    ie: { driver: '3.141.59' },
    userName: process.env.BROWSERSTACK_USERNAME,
    accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
  },
};

export default config;
