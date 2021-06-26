module.exports = {
  core: { builder: 'webpack5' },
  stories: ['../stories/**/*.stories.@(md|ts)x'],
  addons: ['@storybook/addon-essentials', 'creevey']
};
