const path = require('path');

module.exports = {
  gridUrl: 'http://localhost:4444/wd/hub',
  storybookUrl: 'http://localhost:6006',
  storybookDir: path.join(__dirname, 'config/storybook'),
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
