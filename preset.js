/* eslint-disable node/no-missing-require, @typescript-eslint/no-unsafe-assignment */

module.exports = {
  ...require('./lib/cjs/client/addon/preset'),
  /** @type {(entry: string[]) => string[]} */
  config(entry) {
    return [...entry, require.resolve('./lib/cjs/client/addon/decorator')];
  },
};
