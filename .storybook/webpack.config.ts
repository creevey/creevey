import { Configuration } from "webpack";

export default async ({ config }: { config: Configuration }) => {
  config.resolve.extensions = [".tsx", ".ts", ".jsx", ".js"];

  // babel-loader
  config.module.rules[0].test = /\.(mjs|(j|t)sx?)$/;

  // /\.css$/ -> css-loader
  // TODO Remove after update @skbkontur/react-ui
  config.module.rules[2].use[1].options.modules = "global";
  return config;
};
