const modules = process.env.BABEL_MODE === 'esm' ? false : 'auto';

module.exports = {
  presets: [
    '@babel/preset-react',
    '@babel/preset-typescript',
    ['@babel/preset-env', { targets: { node: '16' }, modules }],
  ],
  overrides: [
    {
      test: './src/client',
      presets: [['@babel/preset-env', { targets: { ie: '11' }, modules }]],
    },
  ],
};
