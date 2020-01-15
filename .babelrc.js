module.exports = {
  sourceMaps: 'inline',
  presets: ['@babel/preset-react', '@babel/preset-typescript', ['@babel/preset-env', { targets: { node: true } }]],
  plugins: ['@babel/plugin-proposal-class-properties'],
  overrides: [
    {
      test: './src/storybook.tsx',
      presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
    },
  ],
};
