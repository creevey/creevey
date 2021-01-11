/* eslint-disable */

const fs = require('fs');
const { webpackStoriesProvider } = require('creevey/lib/server/storiesProviders/localWebpackStoriesProvider');

void webpackStoriesProvider
  .loadTestsFromStories({ browsers: ['chrome'] }, () => void 0)
  .then((tests) =>
    fs.writeFileSync(
      'actual-tests.json',
      JSON.stringify(tests, (_, value) => (typeof value == 'function' ? value.toString() : value), 2),
    ),
  )
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  });
