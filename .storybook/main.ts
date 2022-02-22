export default {
  stories: ['../stories/**/*.stories.@(md|ts)x'],
  addons: [
    '@storybook/addon-postcss',
    '@storybook/addon-essentials',
    {
      name: './../src/client/addon/preset',
      options: { clientPort: 8000, creeveyPreExtract: './scripts/babel-register' },
    },
  ],
  features: {
    previewCsfV3: true,
  },
};
