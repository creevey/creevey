import { Configuration, DefinePlugin } from 'webpack';

export default async ({ config }: { config: Configuration }) => {
  config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js'];

  // babel-loader
  config.module.rules[0].test = /\.(mjs|(j|t)sx?)$/;
  config.module.rules[0].use[0].options.overrides = [{ presets: ['@emotion/babel-preset-css-prop'] }];

  // css-loader
  config.module.rules[2].use[1].options.modules = 'global';

  // TODO Embed into utils
  // TODO Use cross-env to define test env
  config.plugins.push(
    new DefinePlugin({
      'process.env.enableReactTesting': JSON.stringify(process.env.NODE_ENV == 'test'),
    }),
  );

  return config;
};
