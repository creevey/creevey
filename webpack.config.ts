import path from 'path';
import { Configuration, DefinePlugin } from 'webpack';

const config: Configuration = {
  entry: [require.resolve('core-js'), require.resolve('regenerator-runtime/runtime'), './src/client/web/index.tsx'],
  output: { path: path.join(__dirname, './lib/client/web') },
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
};

export default config;
