import path from 'path';
import { Configuration as WebpackConfiguration, DefinePlugin } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

const config: WebpackConfiguration & WebpackDevServerConfiguration = {
  entry: [require.resolve('core-js'), require.resolve('regenerator-runtime/runtime'), './src/client/web/index.tsx'],
  output: { path: path.join(__dirname, './lib/cjs/client/web') },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            overrides: [
              {
                // TODO Don't need, see https://babeljs.io/docs/en/babel-preset-env#usebuiltins-entry
                presets: [['@babel/preset-env', { useBuiltIns: 'entry', corejs: 3 }]],
              },
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  devServer: { port: 8000, proxy: { '/': { target: 'http://localhost:3000' } } },
  ...(process.env.WEBPACK_DEV_SERVER
    ? { plugins: [new DefinePlugin({ __CREEVEY_SERVER_PORT__: JSON.stringify('3000') })] }
    : {}),
  performance: false,
  mode: 'development',
};

export default config;
