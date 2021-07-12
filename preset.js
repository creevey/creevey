/* eslint-disable node/no-missing-require */

module.exports = {
  ...require('./lib/cjs/client/addon/preset'),
  /** @type {(entry: string[]) => string[]} */
  config(entry) {
    return [...entry, require.resolve('./lib/esm/client/addon/decorator')];
  },
};
