process.env.__CREEVEY_ENV__ = 'test';

module.exports = {
  require: ['./scripts/babel-register', 'source-map-support/register'],
};
