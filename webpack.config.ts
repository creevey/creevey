import path from 'path';
import { Configuration } from 'webpack';

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
  devServer: {
    port: 8000,
    proxy: {
      '/': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  performance: false,
};

export default config;
