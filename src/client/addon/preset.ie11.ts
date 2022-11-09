import type { Configuration } from 'webpack';

const nodeModulesThatNeedToBeParsedBecauseTheyExposeES6 = ['creevey', '@testing-library'];

const include = new RegExp(
  `[\\\\/]node_modules[\\\\/](${nodeModulesThatNeedToBeParsedBecauseTheyExposeES6.join('|')})`,
);

const es6Loader = {
  test: /\.js$/,
  use: [
    {
      loader: require.resolve('babel-loader'),
      options: {
        presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
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
  };
};
