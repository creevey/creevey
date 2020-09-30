module.exports = {
  sourceMaps: 'inline',
  presets: ['@babel/preset-react', '@babel/preset-typescript', ['@babel/preset-env', { targets: { node: '10' } }]],
  plugins: ['@babel/plugin-proposal-class-properties'],
  overrides: [
    {
      test: './src/addon/decorator.ts',
      presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
    },
  ],
};
