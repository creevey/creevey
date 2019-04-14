import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { Configuration } from "webpack";

const config: Configuration = {
  mode: "production",
  entry: "./src/client/index.tsx",
  output: {
    path: path.join(__dirname, "./lib/client"),
    publicPath: "/"
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /node_modules/,
        use: "babel-loader"
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin({ template: "./src/client/index.html" })],
  devServer: {
    port: 8000,
    proxy: { "/api": "http://localhost:3000" }
  }
};

export default config;
