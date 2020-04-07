import 'zone.js/dist/zone-node';
import { CreeveyConfig } from 'creevey';

const config: CreeveyConfig = {
  gridUrl: 'http://localhost:4444/wd/hub',
  storybookUrl: 'http://192.168.0.101:6006',
  enableFastStoriesLoading: true,
  browsers: {
    chrome: {
      browserName: 'chrome',
      viewport: { width: 1024, height: 720 },
    },
    firefox: {
      browserName: 'firefox',
      viewport: { width: 1024, height: 720 },
    },
  },
};

module.exports = config;
