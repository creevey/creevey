import path from 'path';
import { Configuration as WebpackConfiguration, DefinePlugin } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

const config: WebpackConfiguration & WebpackDevServerConfiguration = {
  entry: [require.resolve('core-js'), require.resolve('regenerator-runtime/runtime'), './src/client/web/index.tsx'],
  output: { path: path.join(__dirname, './dist/esm/client/web') },
  mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              '@babel/preset-typescript',
              // TODO Don't need, see https://babeljs.io/docs/en/babel-preset-env#usebuiltins-entry
              ['@babel/preset-env', { useBuiltIns: 'entry', corejs: 3 }],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    extensionAlias: {
      '.js': ['.tsx', '.ts', '.js'],
    },
  },
  devServer: { port: 8000, proxy: [{ path: '/', target: 'http://localhost:3000' }] },
  ...(process.env.WEBPACK_SERVE
    ? { plugins: [new DefinePlugin({ __CREEVEY_SERVER_PORT__: JSON.stringify('3000') })] }
    : {}),
  performance: false,
};

export default config;
