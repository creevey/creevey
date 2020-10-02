import { Configuration, DefinePlugin } from 'webpack';

export default {
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-essentials', './../src/addon/preset'],
  webpackFinal(config: Configuration) {
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js'];

    // babel-loader
    config.module.rules[0].use[0].options.overrides.push({ presets: ['@emotion/babel-preset-css-prop'] });

    // css-loader
    config.module.rules[7].use[1].options.modules = 'global';

    return config;
  },
};
