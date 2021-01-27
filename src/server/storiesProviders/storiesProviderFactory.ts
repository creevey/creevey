import { StoriesProviderFactory } from '../../types';
import { createDedicatedStorybookStoriesProvider } from './dedicatedStorybookStoriesProvider';
import { createIntegratedStorybookStoriesProvider } from './integratedStorybookStoriesProvider';

export const storiesProviderFactory: StoriesProviderFactory = (options) => {
  if (options.config.storiesProvider === 'integratedStorybook') {
    return createIntegratedStorybookStoriesProvider(options);
  }

  if (options.config.storiesProvider === 'dedicatedStorybook') {
    return createDedicatedStorybookStoriesProvider(options);
  }

  return options.config.storiesProvider(options);
};
