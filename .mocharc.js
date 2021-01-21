process.env.NODE_ENV = 'test';

module.exports = {
  require: ['./scripts/babel-register', 'source-map-support/register'],
};
