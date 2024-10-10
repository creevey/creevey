import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const _require = createRequire(import.meta.url);
/**
 * @type {import("webpack").Configuration & import("webpack-dev-server").Configuration}
 */
const config = {
  entry: [_require.resolve('core-js'), _require.resolve('regenerator-runtime/runtime'), './src/client/web/index.tsx'],
  output: { path: path.join(path.dirname(fileURLToPath(import.meta.url)), './dist/client/web') },
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
      '.js': ['.tsx', '.ts', '.jsx', '.js'],
    },
  },
  devServer: { port: 8000, proxy: [{ path: '/', target: 'http://localhost:3000' }] },
  ...(process.env.WEBPACK_SERVE
    ? { plugins: [new webpack.DefinePlugin({ __CREEVEY_SERVER_PORT__: JSON.stringify('3000') })] }
    : {}),
  performance: false,
};

export default config;
