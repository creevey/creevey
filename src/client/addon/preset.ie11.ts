import type { Configuration } from 'webpack';
import { PluginItem } from '@babel/core';

interface BabelOptions {
  extends: string | null;
  presets: PluginItem[] | null;
}

const ie11Preset = [
  '@babel/preset-env',
  {
    targets: {
      ie: '11',
    },
  },
];

export const babel = (config: BabelOptions): BabelOptions => {
  const { presets = [] } = config;
  return { ...config, presets: [...(presets || []), ie11Preset] };
};

const nodeModulesThatNeedToBeParsedBecauseTheyExposeES6 = ['creevey', '@testing-library'];

const include = new RegExp(`[\\\\/](${nodeModulesThatNeedToBeParsedBecauseTheyExposeES6.join('|')})`);

const es6Loader = {
  test: /\.js$/,
  use: [
    {
      loader: require.resolve('babel-loader'),
      options: {
        presets: [ie11Preset],
      },
    },
  ],
  include,
};

export const managerWebpack = (webpackConfig: Configuration = {}): Configuration => ({
  ...webpackConfig,
  module: {
    ...webpackConfig.module,
    rules: [...(webpackConfig.module?.rules ?? []), es6Loader],
  },
});

export const webpack = (webpackConfig: Configuration = {}): Configuration => {
  const { entry } = webpackConfig;
  const polyfills = [require.resolve('whatwg-fetch')];

  if (Array.isArray(entry)) {
    polyfills.forEach((polyfill) => {
      if (!entry.includes(polyfill)) {
        entry.unshift(polyfill);
      }
    });
  }

  return {
    ...webpackConfig,
    entry,
    module: {
      ...webpackConfig.module,
      rules: [...(webpackConfig.module?.rules ?? []), es6Loader],
    },
  };
};
