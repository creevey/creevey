module.exports = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-actions', '@storybook/addon-links', '@storybook/addon-notes'],
  webpackFinal(config) {
    config.resolve.extensions.unshift('.ts');

    return config
  }
};
