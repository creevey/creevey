// TODO Update config to 7.x
export default {
  stories: ['../stories/**/*.stories.@(md|ts)x'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    {
      name: './../src/client/addon/preset',
      options: { clientPort: 8000 },
    },
  ],
  framework: {
    name: '@storybook/react-vite',
  },
  docs: {
    autodocs: 'tag',
  },
};
