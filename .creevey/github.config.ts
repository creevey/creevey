import { Local as BrowserStack } from 'browserstack-local';
import { CreeveyConfig, noop } from '../src/types';
import baseConfig from './base.config';
import chrome from './browsers/chrome';
import firefox from './browsers/firefox';
import ie11 from './browsers/ie11';

const bs = new BrowserStack();

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome,
    firefox,
    ie11,
  },
  hooks: {
    before: () =>
      new Promise<void>((resolve, reject) =>
        bs.start({ key: process.env.BROWSERSTACK_ACCESS_KEY }, (error) => (error ? reject(error) : resolve())),
      ),
    after: () => bs.stop(noop),
  },
};

export default config;
