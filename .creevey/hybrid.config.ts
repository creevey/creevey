import { CreeveyConfig } from '../src/types';
import { loadStories as hybridProvider } from '../src/server/storybook/providers/hybrid';
import baseConfig from './base.config';
import chrome from './browsers/chrome';
import firefox from './browsers/firefox';
import path from 'path';

const config: CreeveyConfig = {
  ...baseConfig,
  browsers: {
    chrome,
    firefox,
  },
  storiesProvider: hybridProvider,
  testDir: path.join(__dirname, '../stories/tests'),
};

export default config;
