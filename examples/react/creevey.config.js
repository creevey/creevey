module.exports = {
  gridUrl: 'http://localhost:4444/wd/hub',
  storybookUrl: 'http://192.168.0.101:9009',
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
