process.env.__CREEVEY_ENV__ = 'test';

module.exports = {
  require: ['./scripts/babel-register.cjs', 'source-map-support/register'],
};
