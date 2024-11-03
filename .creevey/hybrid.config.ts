import { CreeveyConfig } from '../src/types.js';
import { loadStories as hybridProvider } from '../src/server/storybook/providers/hybrid.js';
import baseConfig from './base.config.js';
import chrome from './browsers/chrome.js';
import firefox from './browsers/firefox.js';
import path from 'path';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome,
    firefox,
  },
  storiesProvider: hybridProvider,
  testsDir: path.join(__dirname, '../stories/tests'),
};

export default config;
