export default {
  stories: ['../stories/**/*.stories.tsx', '../stories/**/*.mdx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
    {
      name: './../src/client/addon/preset',
      options: { clientPort: 8000 },
    },
  ],
  framework: {
    name: '@storybook/react-vite',
  },
};
