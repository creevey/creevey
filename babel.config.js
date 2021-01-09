module.exports = {
  presets: ['@babel/preset-react', '@babel/preset-typescript', ['@babel/preset-env', { targets: { node: '10' } }]],
  plugins: ['@babel/plugin-proposal-class-properties'],
  overrides: [
    {
      test: './src/client',
      presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
    },
  ],
};
