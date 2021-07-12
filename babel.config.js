const modules = process.env.BABEL_MODE === 'esm' ? false : 'auto';

module.exports = {
  presets: [
    '@babel/preset-react',
    '@babel/preset-typescript',
    ['@babel/preset-env', { targets: { node: '10' }, modules }],
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
  overrides: [
    {
      test: './src/client',
      presets: [['@babel/preset-env', { targets: { ie: '11' }, modules }]],
    },
  ],
};
