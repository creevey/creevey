import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration } from 'webpack';

const config: Configuration = {
  entry: './src/client/index.tsx',
  output: { path: path.join(__dirname, './lib/client') },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            overrides: [{ presets: ['@emotion/babel-preset-css-prop'] }],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', { loader: 'css-loader', options: { modules: 'global' } }],
      },
      {
        test: /\.(woff2?|eot|png)$/,
        use: 'file-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/client/index.html' })],
  devServer: {
    port: 8000,
    proxy: {
      '/': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
};

export default config;
