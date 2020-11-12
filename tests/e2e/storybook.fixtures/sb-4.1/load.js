// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires, node/no-unpublished-require
const creevey = require('creevey/lib/server/stories');

void creevey
  .loadTestsFromStories({ browsers: ['chrome'] }, () => void 0)
  .then((tests) => fs.writeFileSync('actual.json', JSON.stringify(tests, null, 2)))
  .catch(console.log);
