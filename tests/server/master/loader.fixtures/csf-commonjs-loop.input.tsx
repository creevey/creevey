// @ts-nocheck
const React = require('react');

exports.default = { title: 'Button' };

['Text', 'Emoji']
  .forEach((story) => exports[story] = () => <button>{story}</button>);