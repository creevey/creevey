import { Configuration } from "webpack";

export default async ({ config }: { config: Configuration }) => {
  config.resolve.extensions = [".tsx", ".ts", ".jsx", ".js"];

  // babel-loader
  config.module.rules[0].test = /\.(mjs|(j|t)sx?)$/;
  config.module.rules[0].use[0].options.overrides = [{ presets: ["@emotion/babel-preset-css-prop"] }];

  config.node = { __filename: true };

  return config;
};
