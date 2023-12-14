export default {
  stories: ['../stories/**/*.stories.@(md|ts)x'],
  addons: [
    '@storybook/addon-postcss',
    '@storybook/addon-essentials',
    {
      name: './../src/client/addon/preset',
      options: { clientPort: 8000, creeveyPreExtract: './scripts/babel-register' },
    },
    '@storybook/addon-mdx-gfm',
  ],
  features: {
    previewCsfV3: true,
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: true,
  },
};
