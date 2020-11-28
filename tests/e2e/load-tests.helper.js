/* eslint-disable */

const fs = require('fs');
const creevey = require('creevey/lib/server/stories');

void creevey
  .loadTestsFromStories({ browsers: ['chrome'] }, () => void 0)
  .then((tests) =>
    fs.writeFileSync(
      'actual.json',
      JSON.stringify(tests, (_, value) => (typeof value == 'function' ? value.toString() : value), 2),
    ),
  );
