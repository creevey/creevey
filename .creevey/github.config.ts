import { Local as BrowserStack } from 'browserstack-local';
import { CreeveyConfig, noop } from '../src/types.js';
import baseConfig from './base.config.js';
import chrome from './browsers/chrome.js';
import firefox from './browsers/firefox.js';
import ie11 from './browsers/ie11.js';

const bs = new BrowserStack();

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome,
    firefox,
    // NOTE: Don't work in Github Actions with error `InvalidArgumentError: Missing parameter: script`
    ...(process.env.CI ? {} : { ie11 }),
  },
  hooks: {
    before: () =>
      new Promise<void>((resolve, reject) => {
        bs.start({ key: process.env.BROWSERSTACK_ACCESS_KEY }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
    after: () => {
      bs.stop(noop);
    },
  },
};

export default config;
