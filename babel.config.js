module.exports = {
  sourceMaps: "inline",
  presets: ["@babel/preset-react", "@babel/preset-typescript", ["@babel/preset-env", { targets: { node: true } }]],
  plugins: ["@babel/plugin-proposal-class-properties", "@babel/plugin-proposal-optional-chaining"],
  overrides: [
    {
      test: "./src/storybook.tsx",
      presets: [["@babel/preset-env", { targets: { ie: "11" } }]]
    }
  ]
};
