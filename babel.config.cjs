module.exports = {
  presets: [
    '@babel/preset-react',
    '@babel/preset-typescript',
    ['@babel/preset-env', { targets: { node: '20' }, modules: false }],
  ],
  overrides: [
    {
      test: ['./src/client', './src/shared'],
      presets: [['@babel/preset-env', { targets: 'defaults', modules: false }]],
    },
  ],
};
