import { StoriesProviderFactory } from '../../types';
import { createLocalWebpackStoriesProvider } from './localWebpackStoriesProvider';

export const storiesProviderFactory: StoriesProviderFactory = (options) => {
  return createLocalWebpackStoriesProvider(options);
};
