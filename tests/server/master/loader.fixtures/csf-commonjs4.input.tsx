// @ts-nocheck
const React = require('react');

const kind = {};
kind.title = 'Button';
kind.decorators = [];
kind.parameters = { React, creevey: {} };
kind.parameters.React = {};
kind.parameters.creevey = {};
exports.default = kind;
exports.default = {};
exports.default.title = 'Button';
exports.default.decorators = [];
exports.default.parameters = { React, creevey: {} };
exports.default.parameters.React = {};
exports.default.parameters.creevey = {};
module.exports.default = kind;
module.exports.default = {};
module.exports.default.title = 'Button';
module.exports.default.decorators = [];
module.exports.default.parameters = { React, creevey: {} };
module.exports.default.parameters.React = {};
module.exports.default.parameters.creevey = {};

const story = () => <div />;
story.decorators = [];
story.parameters = { React, creevey: {} };
story.parameters.React = {};
story.parameters.creevey = {};
exports.story = story;
exports.story.decorators = [];
exports.story.parameters = { React, creevey: {} };
exports.story.parameters.React = {};
exports.story.parameters.creevey = {};
module.exports.story = story;
module.exports.story.decorators = [];
module.exports.story.parameters = { React, creevey: {} };
module.exports.story.parameters.React = {};
module.exports.story.parameters.creevey = {};

exports.story = Object.assign(() => <div />, { decorators: [], parameters: { React, creevey: {} } });
module.exports.story = Object.assign(() => <div />, { decorators: [], parameters: { React, creevey: {} } });

module.exports = {
  default: {
    title: 'Button',
    decorators: [],
    parameters: { React, creevey: {} },
  },
  story,
  story: () => <div />,
  story() { return <div /> },
  story: function () { return <div /> },
  story: Object.assign(() => <div />, { decorators: [], parameters: { React, creevey: {} } }),
};

exports.exports = () => <div />;
exports.exports.parameters = {
  creevey: {
    tests: {
      async exports() {
        const exports = () => Promise.resolve('exports');

        exports.parameters = {};

        await exports();
      },
    },
  },
};

module.exports.module = () => <div />;
module.exports.module.parameters = {
  creevey: {
    tests: {
      async module() {
        const module = () => Promise.resolve('module');

        module.exports = {};
        module.exports.parameters = {};

        await module();
      },
    },
  },
};