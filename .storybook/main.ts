// TODO Update config to 7.x
export default {
  stories: ['../stories/**/*.stories.@(md|ts)x'],
  addons: [
    '@storybook/addon-essentials',
    {
      name: './../src/client/addon/preset',
      options: { clientPort: 8000, creeveyPreExtract: './scripts/babel-register' },
    },
  ],
  // TODO: Do we need it?
  features: {
    previewCsfV3: true,
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
};
