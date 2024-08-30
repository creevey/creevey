import chokidar from 'chokidar';

import { loadStories as browserProvider } from './browser.js';
import type { Config, StoryInput, CreeveyStoryParams, CreeveyStory, StoriesProvider } from '../../../types.js';
import { logger } from '../../logger.js';
import parse, { CreeveyParamsByStoryId } from '../../testsFiles/parser.js';
import { readDirRecursive } from '../../../server/utils.js';
import { combineParameters } from '../../../shared/index.js';

export const loadStories: StoriesProvider = async (
  _config: Config,
  _options,
  storiesListener: (stories: Map<string, StoryInput[]>) => void,
) => {
  let creeveyParamsByStoryId: Partial<CreeveyParamsByStoryId> = {};

  const mergeParamsFromTestsToStory = (story: CreeveyStory, creeveyParams: CreeveyStoryParams): void => {
    if (story.parameters) {
      story.parameters.creevey = combineParameters(story.parameters.creevey ?? {}, creeveyParams);
    }
  };

  const stories = await browserProvider(_config, {}, (updatedStoriesByFiles) => {
    Array.from(updatedStoriesByFiles.entries()).forEach(([, storiesArray]) => {
      storiesArray.forEach((story) => {
        const creeveyParams = creeveyParamsByStoryId[story.id];
        if (creeveyParams) mergeParamsFromTestsToStory(story, creeveyParams);
      });
    });
    storiesListener(updatedStoriesByFiles);
  });

  // TODO fix test files hot reloading
  creeveyParamsByStoryId = await parseParams(_config /*, (data) => console.log(data) */);

  Object.entries(stories).forEach(([storyId, story]) => {
    const creeveyParams = creeveyParamsByStoryId[storyId];
    if (creeveyParams) mergeParamsFromTestsToStory(story, creeveyParams);
  });

  return stories;
};

// TODO Check if it works with watch
async function parseParams(
  config: Config,
  listener?: (data: CreeveyParamsByStoryId) => void,
): Promise<CreeveyParamsByStoryId> {
  if (!config.testsDir) {
    return Promise.resolve({});
  }

  const testFiles = readDirRecursive(config.testsDir).filter((file) => config.testsRegex?.test(file));

  if (listener) {
    chokidar.watch(testFiles).on('change', (filePath) => {
      logger.debug(`changed: ${filePath}`);

      // doesn't work, always returns {} due modules caching
      // see https://github.com/nodejs/modules/issues/307
      void parse(testFiles).then((data) => {
        listener(data);
      });
    });
  }

  return parse(testFiles);
}

loadStories.providerName = 'hybrid';
